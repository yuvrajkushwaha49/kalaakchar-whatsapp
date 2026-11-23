import { GoogleGenAI } from '@google/genai';
import logger from '../../utils/logger.js';

/**
 * Reusable Google Gemini Service
 */

// Model Pricing (per 1,000,000 tokens) in USD
export const MODEL_PRICING = {
  'gemini-1.5-flash': { inputPerM: 0.075, outputPerM: 0.30 },
  'gemini-2.0-flash': { inputPerM: 0.10, outputPerM: 0.40 },
  'gemini-1.5-pro': { inputPerM: 1.25, outputPerM: 5.00 }
};

export function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.3'),
    maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '1000', 10),
    timeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000', 10),
    enabled: process.env.AI_CHAT_ENABLED !== 'false'
  };
}

let aiClient = null;

function getClient(apiKey) {
  if (!aiClient && apiKey && !apiKey.includes('placeholder')) {
    try {
      aiClient = new GoogleGenAI({ apiKey });
    } catch (e) {
      logger.warn(`[GeminiService] Could not initialize GoogleGenAI: ${e.message}`);
    }
  }
  return aiClient;
}

/**
 * Generate chat completion with retry, timeout, and resilient fallback
 */
export async function generateChatResponse({
  systemInstruction,
  messages = [],
  contextChunks = [],
  temperature,
  maxTokens
}) {
  const config = getGeminiConfig();
  const apiKey = config.apiKey;
  const modelName = config.model;
  const temp = typeof temperature === 'number' ? temperature : config.temperature;
  const tokens = typeof maxTokens === 'number' ? maxTokens : config.maxOutputTokens;

  // Build context payload from retrieved knowledge
  let knowledgeContextText = '';
  if (contextChunks && contextChunks.length > 0) {
    knowledgeContextText = `\n\n=== RELEVANT OFFICIAL PLATFORM DOCUMENTATION ===\n` +
      contextChunks.map((c, i) => `[Doc ${i + 1}: ${c.title || c.document_name} (${c.category})]:\n${c.content || c.chunk_content}`).join('\n\n') +
      `\n=== END OF DOCUMENTATION ===\n` +
      `Use the above verified documentation as your primary source of truth. If the answer cannot be found in the documentation, politely suggest contacting human support.\n`;
  }

  const effectiveSystemPrompt = (systemInstruction || '') + knowledgeContextText;

  // 1. Check if real API client is available
  const client = getClient(apiKey);
  const isKeyConfigured = apiKey && !apiKey.includes('placeholder') && apiKey.length > 15;

  if (client && isKeyConfigured) {
    try {
      // Execute with timeout and retry logic
      const result = await executeWithRetry(async () => {
        return Promise.race([
          client.models.generateContent({
            model: modelName,
            contents: messages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            config: {
              systemInstruction: effectiveSystemPrompt,
              temperature: temp,
              maxOutputTokens: tokens
            }
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), config.timeoutMs)
          )
        ]);
      }, 2); // 2 retries on transient errors

      const candidate = result.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || result.text || '';
      const usage = result.usageMetadata || {};

      return {
        content: text,
        inputTokens: usage.promptTokenCount || Math.round(effectiveSystemPrompt.length / 4),
        outputTokens: usage.candidatesTokenCount || Math.round(text.length / 4),
        model: modelName,
        provider: 'gemini'
      };
    } catch (err) {
      logger.error(`[GeminiService] API call failed: ${err.message}. Falling back to knowledge-grounded synthesizer.`);
    }
  }

  // 2. Resilient Knowledge-Grounded Fallback (No live key / Network failure / Mock mode)
  return generateKnowledgeGroundedFallback({
    messages,
    contextChunks,
    modelName
  });
}

/**
 * Retry helper with exponential jitter
 */
async function executeWithRetry(fn, maxRetries = 2) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const isRetryable =
        err.message === 'AI_REQUEST_TIMEOUT' ||
        err.status === 429 ||
        err.status === 503 ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('UNAVAILABLE');

      if (!isRetryable || attempt > maxRetries) {
        throw err;
      }
      const delay = Math.pow(2, attempt) * 500 + Math.random() * 200;
      logger.warn(`[GeminiService] Retryable error (${err.message}). Retrying in ${Math.round(delay)}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/**
 * Intelligent deterministic response synthesizer based strictly on knowledge base documents
 */
function generateKnowledgeGroundedFallback({ messages, contextChunks, modelName }) {
  const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
  const lower = lastUserMsg.toLowerCase();

  let answer = '';

  if (contextChunks && contextChunks.length > 0) {
    // Ground the answer directly in the top matching chunk
    const topChunk = contextChunks[0];
    const chunkBody = (topChunk.content || topChunk.chunk_content || '').trim();

    // Language matching: detect if user asked in Hindi or Hinglish
    const isHindi = /[\u0900-\u097F]/.test(lastUserMsg);
    const isHinglish = /kare|karna|kaise|batao|karein|hai|hoga|mujhe|aap|mera|nahi/.test(lower);

    if (isHindi || isHinglish) {
      answer = `**${topChunk.title || 'प्लेटफ़ॉर्म दस्तावेज़ीकरण'} के अनुसार:**\n\n` +
        cleanMarkdownExcerpt(chunkBody) +
        `\n\n---\n📌 **दस्तावेज़ संदर्भ:** \`${topChunk.path || topChunk.category}\`\n` +
        `यदि आपको और अधिक तकनीकी सहायता चाहिए, तो आप हमारी सपोर्ट टीम से भी संपर्क कर सकते हैं।`;
    } else {
      answer = `**According to our platform documentation (${topChunk.title || topChunk.category}):**\n\n` +
        cleanMarkdownExcerpt(chunkBody) +
        `\n\n---\n📌 **Source:** \`${topChunk.path || topChunk.category}\`\n` +
        `If you need personalized assistance or have further questions, our human support team is also available to help.`;
    }
  } else {
    // If no context chunk was retrieved
    answer = `I'm unable to provide a confirmed answer to this question from our current platform documentation. Please contact our human support team for further assistance.`;
  }

  const estimatedIn = Math.round(lastUserMsg.length / 4) + 150;
  const estimatedOut = Math.round(answer.length / 4);

  return {
    content: answer,
    inputTokens: estimatedIn,
    outputTokens: estimatedOut,
    model: `${modelName}-knowledge-synthesizer`,
    provider: 'knowledge-grounded-fallback'
  };
}

function cleanMarkdownExcerpt(text) {
  // Extract most relevant section or return cleaned text
  const lines = text.split('\n').filter(l => !l.startsWith('# ')).slice(0, 12);
  return lines.join('\n');
}
