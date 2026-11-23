import { Router } from 'express';
import * as aiCopyService from './ai.service.js';
import * as chatbotService from './chatbot.service.js';
import * as conversationService from './conversation.service.js';
import * as knowledgeBaseService from './knowledgeBase.service.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant, requireSuperAdmin } from '../../middleware/tenant.js';
import { requireAiAccess } from '../../middleware/planLimits.js';

const router = Router();

// All AI endpoints require authentication
router.use(authenticate);

// 1. Existing Promotional Copy Generator (Protected by plan feature check)
router.post('/generate-copy', requireTenant, requireAiAccess, async (req, res, next) => {
  try {
    const result = await aiCopyService.generateCopy(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// 2. Chatbot Message Dispatch
router.post('/chat', requireTenant, async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;
    const isSuperAdmin = req.user.role === 'superadmin';

    const result = await chatbotService.processChat({
      tenantId: req.businessId,
      userId: req.user.id,
      conversationId,
      message,
      isSuperAdmin
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 3. User Conversations Management
router.post('/conversations', requireTenant, async (req, res, next) => {
  try {
    const { title } = req.body;
    const conv = await conversationService.createConversation(req.businessId, req.user.id, title);
    res.status(201).json({ success: true, data: conv });
  } catch (err) {
    next(err);
  }
});

router.get('/conversations', requireTenant, async (req, res, next) => {
  try {
    const conversations = await conversationService.getUserConversations(req.businessId, req.user.id);
    res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
});

router.get('/conversations/:id', requireTenant, async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const messages = await conversationService.getConversationMessages(
      req.params.id,
      req.businessId,
      req.user.id,
      isSuperAdmin
    );
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

router.delete('/conversations/:id', requireTenant, async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const result = await conversationService.deleteConversation(
      req.params.id,
      req.businessId,
      req.user.id,
      isSuperAdmin
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 4. Message Feedback (Helpful / Unhelpful)
router.post('/feedback', requireTenant, async (req, res, next) => {
  try {
    const { conversationId, messageId, feedbackType, feedbackComment } = req.body;
    const result = await conversationService.saveFeedback({
      conversationId,
      messageId,
      userId: req.user.id,
      tenantId: req.businessId,
      feedbackType,
      feedbackComment
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// 5. Super Admin AI Management & Monitoring Endpoints
router.get('/admin/analytics', requireSuperAdmin, async (req, res, next) => {
  try {
    const analytics = await conversationService.getAdminAnalytics(req.query.range);
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/conversations', requireSuperAdmin, async (req, res, next) => {
  try {
    const { page, limit, tenantId } = req.query;
    const conversations = await conversationService.getAdminConversations({ page, limit, tenantId });
    res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/knowledge-base/status', requireSuperAdmin, async (req, res, next) => {
  try {
    const status = await knowledgeBaseService.getKnowledgeBaseStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/knowledge-base/reindex', requireSuperAdmin, async (req, res, next) => {
  try {
    const result = await knowledgeBaseService.indexKnowledgeBase();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/settings', requireSuperAdmin, async (req, res, next) => {
  try {
    const settings = await conversationService.getAiSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/settings', requireSuperAdmin, async (req, res, next) => {
  try {
    const settings = await conversationService.updateAiSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

export default router;
