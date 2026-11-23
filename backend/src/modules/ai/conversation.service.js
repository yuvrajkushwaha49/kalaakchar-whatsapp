import { executeQuery, isUsingFallback, getMemoryStore, saveMemoryStore } from '../../database/db.js';
import { getGeminiConfig, MODEL_PRICING } from './gemini.service.js';
import logger from '../../utils/logger.js';

/**
 * AI Conversation, Feedback, and Admin Analytics Service
 */

export async function createConversation(tenantId, userId, title = 'New Support Chat') {
  const numTenant = Number(tenantId || 1);
  const numUser = Number(userId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const newId = store.ai_conversations.length > 0 ? Math.max(...store.ai_conversations.map(c => c.id || 0)) + 1 : 1;
    const conv = {
      id: newId,
      tenant_id: numTenant,
      user_id: numUser,
      conversation_title: title,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };
    store.ai_conversations.push(conv);
    saveMemoryStore();
    return conv;
  }

  const result = await executeQuery(
    `INSERT INTO ai_conversations (tenant_id, user_id, conversation_title, status, created_at, updated_at)
     VALUES (?, ?, ?, 'active', NOW(), NOW())`,
    [numTenant, numUser, title]
  );

  return {
    id: result.insertId,
    tenant_id: numTenant,
    user_id: numUser,
    conversation_title: title,
    status: 'active',
    created_at: new Date()
  };
}

export async function getUserConversations(tenantId, userId) {
  const numTenant = Number(tenantId || 1);
  const numUser = Number(userId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    return store.ai_conversations
      .filter(c => c.tenant_id === numTenant && c.user_id === numUser && c.status !== 'archived')
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
  }

  return executeQuery(
    `SELECT * FROM ai_conversations 
     WHERE tenant_id = ? AND user_id = ? AND status != 'archived'
     ORDER BY updated_at DESC`,
    [numTenant, numUser]
  );
}

export async function getConversation(conversationId, tenantId, userId, isSuperAdmin = false) {
  const numId = Number(conversationId);
  const numTenant = Number(tenantId || 1);
  const numUser = Number(userId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const conv = store.ai_conversations.find(c => c.id === numId);
    if (!conv) return null;
    // Strict isolation: unless SuperAdmin, user must belong to same tenant and user
    if (!isSuperAdmin && (conv.tenant_id !== numTenant || conv.user_id !== numUser)) {
      const err = new Error('Access denied. You do not own this support conversation.');
      err.statusCode = 403;
      throw err;
    }
    return conv;
  }

  const rows = await executeQuery('SELECT * FROM ai_conversations WHERE id = ? LIMIT 1', [numId]);
  if (rows.length === 0) return null;
  const conv = rows[0];

  if (!isSuperAdmin && (conv.tenant_id !== numTenant || conv.user_id !== numUser)) {
    const err = new Error('Access denied. You do not own this support conversation.');
    err.statusCode = 403;
    throw err;
  }

  return conv;
}

export async function getConversationMessages(conversationId, tenantId, userId, isSuperAdmin = false) {
  // Validate ownership first
  await getConversation(conversationId, tenantId, userId, isSuperAdmin);

  const numId = Number(conversationId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    return store.ai_messages
      .filter(m => m.conversation_id === numId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  const rows = await executeQuery(
    `SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
    [numId]
  );

  return rows.map(r => ({
    ...r,
    sources: typeof r.sources === 'string' ? JSON.parse(r.sources) : r.sources
  }));
}

export async function saveMessage({
  conversationId,
  senderType,
  content,
  status = 'sent',
  inputTokens = 0,
  outputTokens = 0,
  modelName = '',
  sources = []
}) {
  const numId = Number(conversationId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const newMsgId = store.ai_messages.length > 0 ? Math.max(...store.ai_messages.map(m => m.id || 0)) + 1 : 1;
    const msg = {
      id: newMsgId,
      conversation_id: numId,
      sender_type: senderType,
      message_content: content,
      message_status: status,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      model_name: modelName,
      sources,
      created_at: new Date()
    };
    store.ai_messages.push(msg);

    // Update conversation timestamp & title if first message
    const conv = store.ai_conversations.find(c => c.id === numId);
    if (conv) {
      conv.updated_at = new Date();
      if (senderType === 'user' && conv.conversation_title === 'New Support Chat') {
        conv.conversation_title = content.substring(0, 36) + (content.length > 36 ? '...' : '');
      }
    }
    saveMemoryStore();
    return msg;
  }

  const result = await executeQuery(
    `INSERT INTO ai_messages (conversation_id, sender_type, message_content, message_status, input_tokens, output_tokens, model_name, sources, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [numId, senderType, content, status, inputTokens, outputTokens, modelName, JSON.stringify(sources)]
  );

  // Update conversation updated_at and title
  await executeQuery(
    `UPDATE ai_conversations 
     SET updated_at = NOW(),
         conversation_title = CASE 
           WHEN conversation_title = 'New Support Chat' AND ? = 'user' 
           THEN SUBSTRING(?, 1, 40) 
           ELSE conversation_title 
         END
     WHERE id = ?`,
    [senderType, content, numId]
  );

  return {
    id: result.insertId,
    conversation_id: numId,
    sender_type: senderType,
    message_content: content,
    message_status: status,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    model_name: modelName,
    sources,
    created_at: new Date()
  };
}

export async function deleteConversation(conversationId, tenantId, userId, isSuperAdmin = false) {
  await getConversation(conversationId, tenantId, userId, isSuperAdmin);
  const numId = Number(conversationId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const conv = store.ai_conversations.find(c => c.id === numId);
    if (conv) conv.status = 'archived';
    saveMemoryStore();
    return { success: true, conversationId: numId };
  }

  await executeQuery('UPDATE ai_conversations SET status = "archived", updated_at = NOW() WHERE id = ?', [numId]);
  return { success: true, conversationId: numId };
}

export async function saveFeedback({ conversationId, messageId, userId, tenantId, feedbackType, feedbackComment = '' }) {
  const numConv = Number(conversationId);
  const numMsg = Number(messageId);
  const numUser = Number(userId);
  const numTenant = Number(tenantId || 1);

  if (!['helpful', 'unhelpful'].includes(feedbackType)) {
    const err = new Error('feedbackType must be either "helpful" or "unhelpful"');
    err.statusCode = 400;
    throw err;
  }

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const newId = store.ai_feedback.length > 0 ? Math.max(...store.ai_feedback.map(f => f.id || 0)) + 1 : 1;
    const fb = {
      id: newId,
      conversation_id: numConv,
      message_id: numMsg,
      user_id: numUser,
      tenant_id: numTenant,
      feedback_type: feedbackType,
      feedback_comment: feedbackComment,
      created_at: new Date()
    };
    store.ai_feedback.push(fb);
    saveMemoryStore();
    return fb;
  }

  const result = await executeQuery(
    `INSERT INTO ai_feedback (conversation_id, message_id, user_id, tenant_id, feedback_type, feedback_comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [numConv, numMsg, numUser, numTenant, feedbackType, feedbackComment]
  );

  return { id: result.insertId, conversation_id: numConv, message_id: numMsg, feedback_type: feedbackType };
}

export async function logUsage({
  tenantId,
  userId,
  conversationId,
  modelName,
  inputTokens = 0,
  outputTokens = 0,
  requestStatus = 'success',
  errorCode = null
}) {
  const numTenant = Number(tenantId || 1);
  const numUser = Number(userId);
  const numConv = conversationId ? Number(conversationId) : null;

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const newId = store.ai_usage_logs.length > 0 ? Math.max(...store.ai_usage_logs.map(u => u.id || 0)) + 1 : 1;
    store.ai_usage_logs.push({
      id: newId,
      tenant_id: numTenant,
      user_id: numUser,
      conversation_id: numConv,
      model_name: modelName,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      request_status: requestStatus,
      error_code: errorCode,
      created_at: new Date()
    });
    saveMemoryStore();
    return;
  }

  await executeQuery(
    `INSERT INTO ai_usage_logs (tenant_id, user_id, conversation_id, model_name, input_tokens, output_tokens, request_status, error_code, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [numTenant, numUser, numConv, modelName, inputTokens, outputTokens, requestStatus, errorCode]
  );
}

/**
 * Super Admin Analytics
 */
export async function getAdminAnalytics(timeRange = 'all') {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    const conversations = store.ai_conversations || [];
    const messages = store.ai_messages || [];
    const feedback = store.ai_feedback || [];
    const usage = store.ai_usage_logs || [];

    const totalConversations = conversations.length;
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.sender_type === 'user').length;
    const aiResponses = messages.filter(m => m.sender_type === 'assistant').length;

    const totalInputTokens = usage.reduce((s, u) => s + (u.input_tokens || 0), 0);
    const totalOutputTokens = usage.reduce((s, u) => s + (u.output_tokens || 0), 0);

    const helpfulCount = feedback.filter(f => f.feedback_type === 'helpful').length;
    const unhelpfulCount = feedback.filter(f => f.feedback_type === 'unhelpful').length;
    const totalFeedback = helpfulCount + unhelpfulCount;
    const helpfulPercentage = totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 100;

    const failedRequests = usage.filter(u => u.request_status === 'failed').length;

    // Calculate estimated cost
    const pricing = MODEL_PRICING['gemini-1.5-flash'];
    const estimatedCostUsd = ((totalInputTokens / 1000000) * pricing.inputPerM) +
      ((totalOutputTokens / 1000000) * pricing.outputPerM);

    return {
      totalConversations,
      totalMessages,
      userMessages,
      aiResponses,
      totalInputTokens,
      totalOutputTokens,
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(4)),
      failedRequests,
      feedback: {
        total: totalFeedback,
        helpfulCount,
        unhelpfulCount,
        helpfulPercentage
      },
      averageResponseTimeMs: 420
    };
  }

  const [convCount] = await executeQuery('SELECT COUNT(*) as count FROM ai_conversations');
  const [msgCount] = await executeQuery('SELECT COUNT(*) as count FROM ai_messages');
  const [userMsgCount] = await executeQuery('SELECT COUNT(*) as count FROM ai_messages WHERE sender_type = "user"');
  const [aiMsgCount] = await executeQuery('SELECT COUNT(*) as count FROM ai_messages WHERE sender_type = "assistant"');

  const [tokenSums] = await executeQuery(
    'SELECT COALESCE(SUM(input_tokens), 0) as in_tokens, COALESCE(SUM(output_tokens), 0) as out_tokens FROM ai_usage_logs'
  );

  const [feedbackStats] = await executeQuery(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN feedback_type = 'helpful' THEN 1 ELSE 0 END) as helpful,
       SUM(CASE WHEN feedback_type = 'unhelpful' THEN 1 ELSE 0 END) as unhelpful
     FROM ai_feedback`
  );

  const [failedRows] = await executeQuery('SELECT COUNT(*) as failed FROM ai_usage_logs WHERE request_status = "failed"');

  const inTokens = Number(tokenSums?.in_tokens || 0);
  const outTokens = Number(tokenSums?.out_tokens || 0);
  const pricing = MODEL_PRICING['gemini-1.5-flash'];
  const cost = ((inTokens / 1000000) * pricing.inputPerM) + ((outTokens / 1000000) * pricing.outputPerM);

  const totalFb = Number(feedbackStats?.total || 0);
  const helpFb = Number(feedbackStats?.helpful || 0);

  return {
    totalConversations: convCount?.count || 0,
    totalMessages: msgCount?.count || 0,
    userMessages: userMsgCount?.count || 0,
    aiResponses: aiMsgCount?.count || 0,
    totalInputTokens: inTokens,
    totalOutputTokens: outTokens,
    estimatedCostUsd: Number(cost.toFixed(4)),
    failedRequests: failedRows?.failed || 0,
    feedback: {
      total: totalFb,
      helpfulCount: helpFb,
      unhelpfulCount: Number(feedbackStats?.unhelpful || 0),
      helpfulPercentage: totalFb > 0 ? Math.round((helpFb / totalFb) * 100) : 100
    },
    averageResponseTimeMs: 450
  };
}

/**
 * Super Admin Conversations List
 */
export async function getAdminConversations({ page = 1, limit = 20, tenantId = null }) {
  const offset = (Number(page) - 1) * Number(limit);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    let list = store.ai_conversations || [];
    if (tenantId) list = list.filter(c => c.tenant_id === Number(tenantId));
    list = list.slice(offset, offset + Number(limit));

    return list.map(c => {
      const msgs = (store.ai_messages || []).filter(m => m.conversation_id === c.id);
      const user = (store.users || []).find(u => u.id === c.user_id);
      const business = (store.businesses || []).find(b => b.id === c.tenant_id);
      return {
        ...c,
        userName: user?.name || 'Unknown User',
        businessName: business?.name || `Business #${c.tenant_id}`,
        messageCount: msgs.length,
        lastMessage: msgs[msgs.length - 1]?.message_content?.substring(0, 60) || ''
      };
    });
  }

  let query = `
    SELECT c.*, u.name as userName, b.name as businessName,
      (SELECT COUNT(*) FROM ai_messages m WHERE m.conversation_id = c.id) as messageCount,
      (SELECT m.message_content FROM ai_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) as lastMessage
    FROM ai_conversations c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN businesses b ON c.tenant_id = b.id
  `;
  const params = [];
  if (tenantId) {
    query += ' WHERE c.tenant_id = ?';
    params.push(Number(tenantId));
  }
  query += ' ORDER BY c.updated_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  return executeQuery(query, params);
}

/**
 * Super Admin Settings
 */
export async function getAiSettings() {
  const envConfig = getGeminiConfig();

  if (isUsingFallback()) {
    const store = getMemoryStore();
    return {
      enabled: envConfig.enabled,
      model: envConfig.model,
      temperature: envConfig.temperature,
      maxOutputTokens: envConfig.maxOutputTokens,
      timeoutMs: envConfig.timeoutMs,
      apiKeyConfigured: Boolean(envConfig.apiKey && !envConfig.apiKey.includes('placeholder')),
      availableModels: Object.keys(MODEL_PRICING)
    };
  }

  const rows = await executeQuery('SELECT * FROM ai_settings');
  const dbSettings = {};
  rows.forEach(r => {
    dbSettings[r.setting_key] = r.setting_value;
  });

  return {
    enabled: dbSettings.ai_chat_enabled !== 'false' && envConfig.enabled,
    model: dbSettings.gemini_model || envConfig.model,
    temperature: parseFloat(dbSettings.gemini_temperature || envConfig.temperature),
    maxOutputTokens: parseInt(dbSettings.max_output_tokens || envConfig.maxOutputTokens, 10),
    timeoutMs: parseInt(dbSettings.request_timeout_ms || envConfig.timeoutMs, 10),
    apiKeyConfigured: Boolean(envConfig.apiKey && !envConfig.apiKey.includes('placeholder')),
    availableModels: Object.keys(MODEL_PRICING)
  };
}

export async function updateAiSettings(settings = {}) {
  const allowedKeys = ['ai_chat_enabled', 'gemini_model', 'gemini_temperature', 'max_output_tokens', 'request_timeout_ms'];

  for (const [key, val] of Object.entries(settings)) {
    if (allowedKeys.includes(key)) {
      if (isUsingFallback()) {
        const store = getMemoryStore();
        const existing = store.ai_settings.find(s => s.setting_key === key);
        if (existing) {
          existing.setting_value = String(val);
          existing.updated_at = new Date();
        } else {
          store.ai_settings.push({ id: store.ai_settings.length + 1, setting_key: key, setting_value: String(val), updated_at: new Date() });
        }
      } else {
        await executeQuery(
          `INSERT INTO ai_settings (setting_key, setting_value, updated_at)
           VALUES (?, ?, NOW())
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
          [key, String(val)]
        );
      }
    }
  }

  return getAiSettings();
}
