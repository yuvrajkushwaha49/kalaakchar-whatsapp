import { Router } from 'express';
import * as autoRepliesService from './autoReplies.service.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant, requireRole } from '../../middleware/tenant.js';
import { requireAutoReplyAccess } from '../../middleware/planLimits.js';

const router = Router();

router.use(authenticate, requireTenant);

// List rules
router.get('/', async (req, res, next) => {
  try {
    const rules = await autoRepliesService.listRules(req.businessId);
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

// Create rule (requires active plan support for keyword_auto_replies)
router.post('/', requireRole(['owner', 'admin', 'marketer']), requireAutoReplyAccess, async (req, res, next) => {
  try {
    const newRule = await autoRepliesService.createRule(req.businessId, req.body);
    res.status(201).json({ success: true, message: 'Auto-reply rule created', data: newRule });
  } catch (err) {
    next(err);
  }
});

// Update rule
router.put('/:id', requireRole(['owner', 'admin', 'marketer']), requireAutoReplyAccess, async (req, res, next) => {
  try {
    const updated = await autoRepliesService.updateRule(req.businessId, req.params.id, req.body);
    res.json({ success: true, message: 'Auto-reply rule updated', data: updated });
  } catch (err) {
    next(err);
  }
});

// Delete rule
router.delete('/:id', requireRole(['owner', 'admin']), async (req, res, next) => {
  try {
    const result = await autoRepliesService.deleteRule(req.businessId, req.params.id);
    res.json({ success: true, message: 'Auto-reply rule deleted', data: result });
  } catch (err) {
    next(err);
  }
});

// Toggle rule active status
router.patch('/:id/toggle', requireRole(['owner', 'admin', 'marketer']), async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const updated = await autoRepliesService.toggleRule(req.businessId, req.params.id, isActive);
    res.json({ success: true, message: 'Status updated', data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
