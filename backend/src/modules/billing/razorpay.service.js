import Razorpay from 'razorpay';
import crypto from 'crypto';
import { executeQuery, isUsingFallback, getMemoryStore, saveMemoryStore } from '../../database/db.js';
import { changePlan, getSubscription } from './billing.service.js';
import { createAuditLog } from '../logs/logs.service.js';
import { createNotification } from '../notifications/notifications.service.js';
import logger from '../../utils/logger.js';

// INR Pricing Mapping (Paise: 1 INR = 100 paise)
const PLAN_PRICING_INR = {
  1: { amount: 0, amountFormatted: '₹0', name: 'Free Trial' },
  2: { amount: 249900, amountFormatted: '₹2,499', name: 'Starter Growth' },
  3: { amount: 649900, amountFormatted: '₹6,499', name: 'Pro Automation' },
  4: { amount: 1999900, amountFormatted: '₹19,999', name: 'Enterprise Scale' }
};

export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const isConfigured = keyId && keySecret && 
    !keyId.includes('placeholder') && 
    !keySecret.includes('placeholder');

  if (!isConfigured) {
    return { isMock: true, keyId: keyId || 'rzp_test_placeholder_key' };
  }

  const instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });

  return { instance, isMock: false, keyId };
}

export function getRazorpayConfig() {
  const { isMock, keyId } = getRazorpayClient();
  return {
    keyId: isMock ? 'rzp_test_mock_mode' : keyId,
    isMock,
    currency: 'INR',
    plansPricing: PLAN_PRICING_INR
  };
}

/**
 * Create a new Razorpay order for subscription upgrade
 */
export async function createPaymentOrder({ businessId, userId, planId, billingCycle = 'monthly' }) {
  const numBizId = Number(businessId);
  const numPlanId = Number(planId);

  const planInfo = PLAN_PRICING_INR[numPlanId];
  if (!planInfo) {
    const err = new Error(`Invalid plan ID: ${numPlanId}`);
    err.statusCode = 400;
    throw err;
  }

  // Free plan requires no payment
  if (numPlanId === 1 || planInfo.amount === 0) {
    await changePlan(numBizId, 1);
    return {
      isFree: true,
      planId: 1,
      message: 'Switched to Free Trial without charge.'
    };
  }

  const receipt = `rcpt_b${numBizId}_p${numPlanId}_${Date.now().toString(36)}`;
  const { instance, isMock, keyId } = getRazorpayClient();

  let order;
  if (isMock) {
    const mockOrderId = `order_mock_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    order = {
      id: mockOrderId,
      entity: 'order',
      amount: planInfo.amount,
      amount_paid: 0,
      amount_due: planInfo.amount,
      currency: 'INR',
      receipt,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000)
    };
    logger.info(`[Razorpay:Mock] Created mock order ${mockOrderId} for Business #${numBizId} (Amount: ${planInfo.amountFormatted})`);
  } else {
    try {
      order = await instance.orders.create({
        amount: planInfo.amount,
        currency: 'INR',
        receipt,
        notes: {
          businessId: String(numBizId),
          userId: String(userId),
          planId: String(numPlanId),
          billingCycle
        }
      });
      logger.info(`[Razorpay] Created live order ${order.id} for Business #${numBizId} (${planInfo.amountFormatted})`);
    } catch (apiErr) {
      logger.error('[Razorpay] Order creation failed:', apiErr);
      const err = new Error(`Razorpay Order creation error: ${apiErr.message}`);
      err.statusCode = 502;
      throw err;
    }
  }

  // Record order in persistence
  const orderRecord = {
    id: order.id,
    business_id: numBizId,
    user_id: Number(userId) || null,
    plan_id: numPlanId,
    amount: planInfo.amount,
    currency: 'INR',
    receipt,
    status: 'created',
    created_at: new Date()
  };

  if (isUsingFallback()) {
    const store = getMemoryStore();
    if (!store.payment_orders) store.payment_orders = [];
    store.payment_orders.unshift(orderRecord);
    saveMemoryStore();
  } else {
    await executeQuery(
      `INSERT INTO payment_orders (id, business_id, user_id, plan_id, amount, currency, receipt, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'created', NOW())
       ON DUPLICATE KEY UPDATE status=VALUES(status)`,
      [order.id, numBizId, Number(userId) || null, numPlanId, planInfo.amount, 'INR', receipt]
    ).catch(() => {});
  }

  return {
    orderId: order.id,
    amount: order.amount,
    amountFormatted: planInfo.amountFormatted,
    currency: 'INR',
    keyId: isMock ? 'rzp_test_mock_mode' : keyId,
    isMock,
    planId: numPlanId,
    planName: planInfo.name
  };
}

/**
 * Verify Razorpay payment signature and activate plan
 */
export async function verifyPayment({
  businessId,
  userId,
  planId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature
}) {
  const numBizId = Number(businessId);
  const numPlanId = Number(planId);

  if (!razorpay_order_id || !razorpay_payment_id) {
    const err = new Error('Missing Razorpay order ID or payment ID.');
    err.statusCode = 400;
    throw err;
  }

  const { isMock } = getRazorpayClient();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // Real Signature Verification
  if (!isMock) {
    if (!razorpay_signature) {
      const err = new Error('Razorpay signature is required for payment verification.');
      err.statusCode = 400;
      throw err;
    }
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated = crypto.createHmac('sha256', keySecret).update(text).digest('hex');

    if (generated !== razorpay_signature) {
      logger.error(`[Razorpay] Invalid payment signature for order ${razorpay_order_id}`);
      const err = new Error('Payment signature verification failed. Untrusted response.');
      err.statusCode = 400;
      throw err;
    }
  }

  logger.info(`✅ [Razorpay] Payment verified successfully: Payment ID ${razorpay_payment_id} for Order ${razorpay_order_id}`);

  // 1. Upgrade Business Subscription
  await changePlan(numBizId, numPlanId);

  // 2. Persist Payment Transaction
  const planInfo = PLAN_PRICING_INR[numPlanId] || { amount: 0, amountFormatted: '₹0', name: 'Subscription Plan' };
  const txRecord = {
    id: `tx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    business_id: numBizId,
    user_id: Number(userId) || null,
    plan_id: numPlanId,
    order_id: razorpay_order_id,
    payment_id: razorpay_payment_id,
    amount: planInfo.amount,
    currency: 'INR',
    status: 'captured',
    created_at: new Date()
  };

  if (isUsingFallback()) {
    const store = getMemoryStore();
    if (!store.payment_transactions) store.payment_transactions = [];
    store.payment_transactions.unshift(txRecord);
    saveMemoryStore();
  } else {
    await executeQuery(
      `INSERT INTO payment_transactions (id, business_id, user_id, plan_id, order_id, payment_id, amount, currency, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'captured', NOW())`,
      [txRecord.id, numBizId, Number(userId) || null, numPlanId, razorpay_order_id, razorpay_payment_id, planInfo.amount, 'INR']
    ).catch(() => {});
  }

  // 3. Create Audit Log
  createAuditLog({
    businessId: numBizId,
    userId: Number(userId) || null,
    action: 'PLAN_UPGRADE',
    entityType: 'BILLING',
    entityId: numPlanId,
    details: {
      message: `Upgraded to ${planInfo.name} (${planInfo.amountFormatted}) via Razorpay`,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    },
    ipAddress: '127.0.0.1'
  }).catch(() => {});

  // 4. Create Notification
  createNotification({
    businessId: numBizId,
    title: 'Subscription Upgraded!',
    message: `Your workspace subscription has been upgraded to ${planInfo.name}. All features and quotas are now unlocked.`,
    type: 'success',
    link: '/billing'
  }).catch(() => {});

  const updatedSub = await getSubscription(numBizId);

  return {
    success: true,
    message: `Successfully upgraded to ${planInfo.name}!`,
    paymentId: razorpay_payment_id,
    subscription: updatedSub
  };
}

/**
 * List payment transaction history for this workspace
 */
export async function listPaymentHistory(businessId) {
  const numBizId = Number(businessId);
  if (isUsingFallback()) {
    const store = getMemoryStore();
    return (store.payment_transactions || [])
      .filter(t => t.business_id === numBizId)
      .map(t => {
        const plan = PLAN_PRICING_INR[t.plan_id] || { name: 'Plan' };
        return {
          ...t,
          plan_name: plan.name,
          amount_formatted: `₹${(t.amount / 100).toLocaleString('en-IN')}`
        };
      });
  }

  const rows = await executeQuery(
    `SELECT t.*, p.name as plan_name 
     FROM payment_transactions t
     LEFT JOIN subscription_plans p ON t.plan_id = p.id
     WHERE t.business_id = ?
     ORDER BY t.created_at DESC`,
    [numBizId]
  );
  return rows.map(r => ({
    ...r,
    amount_formatted: `₹${(r.amount / 100).toLocaleString('en-IN')}`
  }));
}

export default {
  getRazorpayConfig,
  createPaymentOrder,
  verifyPayment,
  listPaymentHistory
};
