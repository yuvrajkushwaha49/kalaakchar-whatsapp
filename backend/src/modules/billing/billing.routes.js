import { Router } from 'express';
import * as billingService from './billing.service.js';
import * as razorpayService from './razorpay.service.js';
import { authenticate } from '../../middleware/auth.js';
import { requireTenant, requireRole } from '../../middleware/tenant.js';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/plans', async (req, res, next) => {
  try {
    const plans = await billingService.listPlans();
    res.json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
});

router.get('/subscription', async (req, res, next) => {
  try {
    const sub = await billingService.getSubscription(req.businessId);
    res.json({ success: true, data: sub });
  } catch (err) {
    next(err);
  }
});

router.get('/features', async (req, res, next) => {
  try {
    const features = await billingService.getTenantPlanFeatures(req.businessId);
    res.json({ success: true, data: features });
  } catch (err) {
    next(err);
  }
});

router.get('/usage', async (req, res, next) => {
  try {
    const usage = await billingService.getUsage(req.businessId);
    res.json({ success: true, data: usage });
  } catch (err) {
    next(err);
  }
});

// Razorpay: Get client config (Key ID & Currency)
router.get('/razorpay-config', (req, res) => {
  res.json({ success: true, data: razorpayService.getRazorpayConfig() });
});

// Razorpay: Create Payment Order
router.post('/create-order', requireRole(['owner']), async (req, res, next) => {
  try {
    const { planId, billingCycle } = req.body;
    const orderData = await razorpayService.createPaymentOrder({
      businessId: req.businessId,
      userId: req.user?.id,
      planId,
      billingCycle
    });
    res.json({ success: true, data: orderData });
  } catch (err) {
    next(err);
  }
});

// Razorpay: Verify Payment Signature and activate plan
router.post('/verify-payment', requireRole(['owner']), async (req, res, next) => {
  try {
    const {
      planId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    const result = await razorpayService.verifyPayment({
      businessId: req.businessId,
      userId: req.user?.id,
      planId,
      razorpay_order_id: razorpay_order_id || razorpayOrderId,
      razorpay_payment_id: razorpay_payment_id || razorpayPaymentId,
      razorpay_signature: razorpay_signature || razorpaySignature
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Transaction History
router.get('/transactions', async (req, res, next) => {
  try {
    const history = await razorpayService.listPaymentHistory(req.businessId);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

router.post('/upgrade', requireRole(['owner']), async (req, res, next) => {
  try {
    const { planId } = req.body;
    const result = await billingService.changePlan(req.businessId, planId);
    res.json({ success: true, message: 'Plan upgraded successfully', data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
