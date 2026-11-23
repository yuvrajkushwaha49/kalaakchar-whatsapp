import { executeQuery, isUsingFallback, getMemoryStore, saveMemoryStore } from '../../database/db.js';
import { getSubscription } from '../billing/billing.service.js';
import { createAuditLog } from '../logs/logs.service.js';
import { emitToTenant } from '../../socket.js';
import logger from '../../utils/logger.js';
import { MetaCloudApiClient } from '../whatsapp/metaClient.js';
import { decryptToken } from '../../utils/crypto.js';

export async function listRules(businessId) {
  const numBizId = Number(businessId);
  if (isUsingFallback()) {
    const store = getMemoryStore();
    return (store.keyword_auto_replies || [])
      .filter(r => r.business_id === numBizId)
      .sort((a, b) => b.id - a.id);
  }

  const rows = await executeQuery(
    'SELECT * FROM keyword_auto_replies WHERE business_id = ? ORDER BY id DESC',
    [numBizId]
  );
  return rows;
}

export async function createRule(businessId, { keyword, match_type = 'contains', reply_text, is_active = 1 }) {
  const numBizId = Number(businessId);

  if (!keyword || !keyword.trim()) {
    const err = new Error('Keyword is required');
    err.statusCode = 400;
    throw err;
  }
  if (!reply_text || !reply_text.trim()) {
    const err = new Error('Reply message text is required');
    err.statusCode = 400;
    throw err;
  }

  // Plan Limit Check
  const sub = await getSubscription(numBizId);
  const maxRules = sub?.features?.max_auto_reply_rules ?? 0;
  const existingRules = await listRules(numBizId);

  if (existingRules.length >= maxRules) {
    const err = new Error(
      `Your current plan (${sub?.plan_name || 'Free'}) allows up to ${maxRules} keyword auto-reply rules. Upgrade your subscription to add more.`
    );
    err.statusCode = 403;
    err.code = 'LIMIT_REACHED';
    throw err;
  }

  const cleanKeyword = keyword.trim().toUpperCase();
  const cleanMatch = ['exact', 'contains', 'starts_with'].includes(match_type) ? match_type : 'contains';
  const cleanReply = reply_text.trim();
  const activeFlag = is_active ? 1 : 0;

  if (isUsingFallback()) {
    const store = getMemoryStore();
    if (!store.keyword_auto_replies) store.keyword_auto_replies = [];
    const newId = store.keyword_auto_replies.length > 0 
      ? Math.max(...store.keyword_auto_replies.map(r => r.id || 0)) + 1 
      : 1;

    const newRule = {
      id: newId,
      business_id: numBizId,
      keyword: cleanKeyword,
      match_type: cleanMatch,
      reply_text: cleanReply,
      is_active: activeFlag,
      trigger_count: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    store.keyword_auto_replies.unshift(newRule);
    saveMemoryStore();
    return newRule;
  }

  const result = await executeQuery(
    `INSERT INTO keyword_auto_replies (business_id, keyword, match_type, reply_text, is_active, trigger_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
    [numBizId, cleanKeyword, cleanMatch, cleanReply, activeFlag]
  );

  return {
    id: result.insertId,
    business_id: numBizId,
    keyword: cleanKeyword,
    match_type: cleanMatch,
    reply_text: cleanReply,
    is_active: activeFlag,
    trigger_count: 0,
    created_at: new Date()
  };
}

export async function updateRule(businessId, ruleId, { keyword, match_type, reply_text, is_active }) {
  const numBizId = Number(businessId);
  const numRuleId = Number(ruleId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const rule = (store.keyword_auto_replies || []).find(r => r.id === numRuleId && r.business_id === numBizId);
    if (!rule) {
      const err = new Error('Auto-reply rule not found');
      err.statusCode = 404;
      throw err;
    }
    if (keyword !== undefined) rule.keyword = keyword.trim().toUpperCase();
    if (match_type !== undefined) rule.match_type = match_type;
    if (reply_text !== undefined) rule.reply_text = reply_text.trim();
    if (is_active !== undefined) rule.is_active = is_active ? 1 : 0;
    rule.updated_at = new Date();
    saveMemoryStore();
    return rule;
  }

  await executeQuery(
    `UPDATE keyword_auto_replies 
     SET keyword = COALESCE(?, keyword),
         match_type = COALESCE(?, match_type),
         reply_text = COALESCE(?, reply_text),
         is_active = COALESCE(?, is_active),
         updated_at = NOW()
     WHERE id = ? AND business_id = ?`,
    [
      keyword ? keyword.trim().toUpperCase() : null,
      match_type || null,
      reply_text ? reply_text.trim() : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      numRuleId,
      numBizId
    ]
  );

  const [updated] = await executeQuery(
    'SELECT * FROM keyword_auto_replies WHERE id = ? AND business_id = ?',
    [numRuleId, numBizId]
  );
  return updated;
}

export async function deleteRule(businessId, ruleId) {
  const numBizId = Number(businessId);
  const numRuleId = Number(ruleId);

  if (isUsingFallback()) {
    const store = getMemoryStore();
    const idx = (store.keyword_auto_replies || []).findIndex(r => r.id === numRuleId && r.business_id === numBizId);
    if (idx === -1) {
      const err = new Error('Auto-reply rule not found');
      err.statusCode = 404;
      throw err;
    }
    store.keyword_auto_replies.splice(idx, 1);
    saveMemoryStore();
    return { success: true, id: numRuleId };
  }

  await executeQuery(
    'DELETE FROM keyword_auto_replies WHERE id = ? AND business_id = ?',
    [numRuleId, numBizId]
  );
  return { success: true, id: numRuleId };
}

export async function toggleRule(businessId, ruleId, isActive) {
  return updateRule(businessId, ruleId, { is_active: Boolean(isActive) });
}

/**
 * Trigger matching rule for an inbound message
 */
export async function matchAndTriggerAutoReply(businessId, incomingText, senderPhone, whatsappAccountId) {
  if (!incomingText || !incomingText.trim()) return null;
  const numBizId = Number(businessId);

  // 1. Check if business has auto-reply feature enabled in plan
  const sub = await getSubscription(numBizId);
  if (!sub?.features?.keyword_auto_replies) {
    return null;
  }

  const rawText = incomingText.trim();
  const upperText = rawText.toUpperCase();
  const rules = await listRules(numBizId);
  const activeRules = rules.filter(r => r.is_active);

  // 2. Find matching rule
  let matchedRule = null;
  for (const rule of activeRules) {
    const kw = rule.keyword.toUpperCase();
    if (rule.match_type === 'exact' && upperText === kw) {
      matchedRule = rule;
      break;
    } else if (rule.match_type === 'starts_with' && upperText.startsWith(kw)) {
      matchedRule = rule;
      break;
    } else if (rule.match_type === 'contains' && upperText.includes(kw)) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) return null;

  logger.info(`🤖 [AutoReply] Matched rule #${matchedRule.id} ("${matchedRule.keyword}") for inbound message from ${senderPhone}`);

  // 3. Increment trigger count
  matchedRule.trigger_count = (matchedRule.trigger_count || 0) + 1;
  if (isUsingFallback()) {
    saveMemoryStore();
  } else {
    await executeQuery(
      'UPDATE keyword_auto_replies SET trigger_count = trigger_count + 1 WHERE id = ?',
      [matchedRule.id]
    ).catch(() => {});
  }

  // 4. Send WhatsApp automated response text
  let sentMessageId = `wamid.bot_${Date.now()}`;
  try {
    let client = null;
    if (isUsingFallback()) {
      const store = getMemoryStore();
      const acc = (store.whatsapp_accounts || []).find(
        a => a.business_id === numBizId && (whatsappAccountId ? a.id === Number(whatsappAccountId) : a.is_primary)
      );
      if (acc) {
        const token = acc.access_token_encrypted ? decryptToken(acc.access_token_encrypted) : (process.env.WHATSAPP_ACCESS_TOKEN || '');
        client = new MetaCloudApiClient(token, acc.phone_number_id, acc.waba_id);
      }
    } else {
      const [acc] = await executeQuery(
        'SELECT * FROM whatsapp_accounts WHERE business_id = ? AND (id = ? OR is_primary = 1) LIMIT 1',
        [numBizId, whatsappAccountId || 0]
      );
      if (acc) {
        const token = acc.access_token_encrypted ? decryptToken(acc.access_token_encrypted) : (process.env.WHATSAPP_ACCESS_TOKEN || '');
        client = new MetaCloudApiClient(token, acc.phone_number_id, acc.waba_id);
      }
    }

    if (client) {
      const resp = await client.sendTextMessage({
        recipientPhone: senderPhone,
        textBody: matchedRule.reply_text
      });
      sentMessageId = resp?.messages?.[0]?.id || sentMessageId;
    }
  } catch (err) {
    logger.warn(`[AutoReply] WhatsApp dispatch warning: ${err.message}`);
  }

  // 5. Audit Log
  createAuditLog({
    businessId: numBizId,
    userId: null,
    action: 'AUTO_REPLY_TRIGGERED',
    entityType: 'INBOX',
    entityId: matchedRule.id,
    details: {
      keyword: matchedRule.keyword,
      recipient: senderPhone,
      messageId: sentMessageId
    },
    ipAddress: '127.0.0.1'
  }).catch(() => {});

  return {
    matched: true,
    rule: matchedRule,
    replyText: matchedRule.reply_text,
    sentMessageId
  };
}

export default {
  listRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  matchAndTriggerAutoReply
};
