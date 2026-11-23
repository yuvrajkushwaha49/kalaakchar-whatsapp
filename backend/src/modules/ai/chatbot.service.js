import { validateTopic, STANDARD_RESTRICTION_RESPONSE } from './topicGuard.service.js';
import { searchKnowledgeBase } from './knowledgeBase.service.js';
import { generateChatResponse } from './gemini.service.js';
import {
  createConversation,
  getConversation,
  getConversationMessages,
  saveMessage,
  logUsage,
  getAiSettings
} from './conversation.service.js';
import logger from '../../utils/logger.js';

/**
 * Chatbot Orchestration Service
 */

const SYSTEM_PROMPT = `# ROLE: WhatsApp SaaS AI Support Assistant

You are an intelligent, professional and friendly AI support assistant for our WhatsApp SaaS platform (CampaignFlow / Aiveexa).

## Primary Responsibility
Your ONLY responsibility is to answer questions directly related to our WhatsApp SaaS platform, its features, functionality, configuration, usage, billing and technical troubleshooting.
You must behave like a specialized WhatsApp SaaS product expert.

## Allowed Topics
- WhatsApp Business API & Meta WhatsApp Cloud API
- WhatsApp Embedded Signup & Number Connection
- QR Code and Number Verification
- Message Broadcasting & Campaign Management
- Marketing, Utility and Authentication Templates
- Audio, Image, Document and Video Messaging
- Contact Management, CSV/Excel Import and Export, Audience Segmentation
- Team Inbox, Agent Assignment, Live Chat, Internal Notes, 24-hour service window
- Keyword Auto-Replies, Chatbot Builder, Workflow Automation
- Webhooks and REST API Integration
- Analytics, Reports, Message Delivery Status (Sent, Delivered, Read, Failed)
- Subscription Plans (Free Trial ₹0, Starter ₹2,499, Pro ₹6,499, Enterprise ₹19,999) & Razorpay Billing
- User Roles (SuperAdmin, Owner, Admin, Marketer, Agent) and Permissions
- Technical Errors (Meta Error 131047, 131026, 130429, 131051, 132000, 190) and Troubleshooting

## Strict Topic Restriction
You MUST NOT answer questions unrelated to this WhatsApp SaaS platform.
If a user asks an unrelated question, respond with:
"${STANDARD_RESTRICTION_RESPONSE}"

## Response Guidelines
- Respond in the same language as the user (Hindi, English, or Hinglish).
- Keep answers simple, professional, friendly and step-by-step.
- Ground all facts in the provided platform documentation.
- If information is not in the documentation, recommend contacting human support.
- Never invent platform features, fake endpoints, or unverified pricing.`;

/**
 * Process an incoming chat message through the 14-step pipeline
 */
export async function processChat({
  tenantId,
  userId,
  conversationId = null,
  message,
  isSuperAdmin = false
}) {
  const startTime = Date.now();
  const trimmedMessage = (message || '').trim();

  // 1. Validate message input
  if (!trimmedMessage) {
    const err = new Error('Message cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  if (trimmedMessage.length > 2000) {
    const err = new Error('Message exceeds the maximum allowed length of 2000 characters.');
    err.statusCode = 400;
    throw err;
  }

  // 2. Check if AI service is enabled
  const settings = await getAiSettings();
  if (!settings.enabled) {
    return {
      success: false,
      error: {
        message: 'The AI Support Assistant is currently disabled by system administrator. Please reach out to human support.',
        code: 'AI_SERVICE_DISABLED'
      }
    };
  }

  // 3. Resolve or create conversation with strict tenant validation
  let activeConversationId = conversationId ? Number(conversationId) : null;
  if (!activeConversationId) {
    const newConv = await createConversation(tenantId, userId, trimmedMessage.substring(0, 36));
    activeConversationId = newConv.id;
  } else {
    // Validate that authenticated user owns this conversation
    await getConversation(activeConversationId, tenantId, userId, isSuperAdmin);
  }

  // 4. Topic Guard check
  const topicCheck = validateTopic(trimmedMessage);

  if (!topicCheck.allowed) {
    logger.info(`🚫 [Chatbot] TopicGuard blocked message: "${trimmedMessage.substring(0, 50)}..." (Reason: ${topicCheck.reason})`);

    // Save user message
    await saveMessage({
      conversationId: activeConversationId,
      senderType: 'user',
      content: trimmedMessage,
      status: 'blocked'
    });

    // Save standard restricted assistant response
    const restrictedMsg = await saveMessage({
      conversationId: activeConversationId,
      senderType: 'assistant',
      content: topicCheck.standardResponse || STANDARD_RESTRICTION_RESPONSE,
      status: 'blocked',
      modelName: 'topic-guard',
      sources: []
    });

    // Log blocked usage
    await logUsage({
      tenantId,
      userId,
      conversationId: activeConversationId,
      modelName: 'topic-guard',
      requestStatus: 'blocked',
      errorCode: topicCheck.reason
    });

    return {
      success: true,
      conversationId: activeConversationId,
      message: {
        id: restrictedMsg.id,
        role: 'assistant',
        content: restrictedMsg.message_content,
        sources: []
      },
      sources: [],
      isBlocked: true
    };
  }

  // 5. Search approved Knowledge Base documentation
  let retrievedChunks = [];
  try {
    retrievedChunks = await searchKnowledgeBase(trimmedMessage, 4);
  } catch (kErr) {
    logger.warn(`[Chatbot] Knowledge search issue: ${kErr.message}`);
  }

  // Build clean sources array for client citation
  const sources = retrievedChunks.map(c => ({
    title: c.title,
    category: c.category,
    path: c.path
  }));

  // 6. Load recent conversation memory (last 6 messages)
  let conversationHistory = [];
  try {
    const recentMsgs = await getConversationMessages(activeConversationId, tenantId, userId, isSuperAdmin);
    conversationHistory = recentMsgs.slice(-6).map(m => ({
      role: m.sender_type,
      content: m.message_content
    }));
  } catch (mErr) {
    logger.warn(`[Chatbot] Could not load conversation history: ${mErr.message}`);
  }

  // Append the current message to history
  conversationHistory.push({ role: 'user', content: trimmedMessage });

  // 7. Save user message to database
  await saveMessage({
    conversationId: activeConversationId,
    senderType: 'user',
    content: trimmedMessage,
    status: 'sent'
  });

  // 8. Generate response via Gemini service
  let aiResult;
  try {
    aiResult = await generateChatResponse({
      systemInstruction: SYSTEM_PROMPT,
      messages: conversationHistory,
      contextChunks: retrievedChunks,
      temperature: settings.temperature,
      maxTokens: settings.maxOutputTokens
    });
  } catch (genErr) {
    logger.error(`❌ [Chatbot] Generation failed: ${genErr.message}`);

    await logUsage({
      tenantId,
      userId,
      conversationId: activeConversationId,
      modelName: settings.model,
      requestStatus: 'failed',
      errorCode: genErr.message
    });

    // Friendly human support fallback
    const fallbackText = "I'm unable to process this request at the moment due to a temporary service interruption. Please try again shortly or contact our human support team.";

    const fallbackMsg = await saveMessage({
      conversationId: activeConversationId,
      senderType: 'assistant',
      content: fallbackText,
      status: 'failed',
      modelName: settings.model,
      sources: []
    });

    return {
      success: true,
      conversationId: activeConversationId,
      message: {
        id: fallbackMsg.id,
        role: 'assistant',
        content: fallbackText,
        sources: []
      },
      sources: []
    };
  }

  // 9. Save assistant message with token usage & sources
  const assistantMsg = await saveMessage({
    conversationId: activeConversationId,
    senderType: 'assistant',
    content: aiResult.content,
    status: 'sent',
    inputTokens: aiResult.inputTokens,
    outputTokens: aiResult.outputTokens,
    modelName: aiResult.model,
    sources
  });

  // 10. Log usage
  await logUsage({
    tenantId,
    userId,
    conversationId: activeConversationId,
    modelName: aiResult.model,
    inputTokens: aiResult.inputTokens,
    outputTokens: aiResult.outputTokens,
    requestStatus: 'success'
  });

  const durationMs = Date.now() - startTime;
  logger.info(`✨ [Chatbot] Completed response in ${durationMs}ms (${aiResult.inputTokens}in / ${aiResult.outputTokens}out tokens)`);

  return {
    success: true,
    conversationId: activeConversationId,
    message: {
      id: assistantMsg.id,
      role: 'assistant',
      content: assistantMsg.message_content,
      sources
    },
    sources
  };
}
