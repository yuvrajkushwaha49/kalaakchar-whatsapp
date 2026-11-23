import { getSubscription } from '../modules/billing/billing.service.js';

/**
 * Middleware factory to require a specific feature flag from the tenant's current subscription plan.
 * E.g. requireFeature('ai_copy_generator', 'AI Campaign Assistant')
 */
export function requireFeature(featureKey, featureDisplayName = 'This feature') {
  return async (req, res, next) => {
    try {
      const businessId = req.businessId;
      if (!businessId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Business context required.', code: 'UNAUTHORIZED' }
        });
      }

      const sub = await getSubscription(businessId);
      const planFeatures = sub?.features || {};
      const hasAccess = Boolean(planFeatures[featureKey]);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PLAN_FEATURE_LOCKED',
            message: `${featureDisplayName} is not included in your current "${sub?.plan_name || 'Free Trial'}" plan. Please upgrade your subscription to unlock this feature.`,
            feature: featureKey,
            currentPlan: sub?.plan_name || 'Free Trial',
            planId: sub?.plan_id || 1,
            suggestedUpgrade: 'Starter Growth or Pro Automation'
          }
        });
      }

      req.tenantSubscription = sub;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Specific middleware for AI Copy generation
 * Checks feature flag + monthly AI limits
 */
export async function requireAiAccess(req, res, next) {
  try {
    const businessId = req.businessId;
    const sub = await getSubscription(businessId);
    const planFeatures = sub?.features || {};

    if (!planFeatures.ai_copy_generator) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PLAN_FEATURE_LOCKED',
          message: `AI Campaign Copywriter is not included in your current "${sub?.plan_name || 'Free Trial'}" plan. Upgrade to Starter or Pro to use AI tools.`,
          feature: 'ai_copy_generator',
          currentPlan: sub?.plan_name || 'Free Trial',
          planId: sub?.plan_id || 1,
          suggestedUpgrade: 'Starter Growth or Pro Automation'
        }
      });
    }

    req.tenantSubscription = sub;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware for Campaign Scheduling (future date/time)
 * Instant broadcasts are allowed on all plans, but scheduled/recurring require Starter+
 */
export async function requireScheduledBroadcastAccess(req, res, next) {
  try {
    const isScheduled = Boolean(req.body.scheduledAt || req.body.scheduled_at);
    if (!isScheduled) {
      return next(); // Instant campaign is allowed
    }

    const businessId = req.businessId;
    const sub = await getSubscription(businessId);
    const planFeatures = sub?.features || {};

    if (!planFeatures.scheduled_campaigns) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PLAN_FEATURE_LOCKED',
          message: `Automated campaign scheduling is not available on "${sub?.plan_name || 'Free Trial'}". Upgrade to Starter Growth or Pro Automation to schedule broadcasts in advance.`,
          feature: 'scheduled_campaigns',
          currentPlan: sub?.plan_name || 'Free Trial',
          planId: sub?.plan_id || 1,
          suggestedUpgrade: 'Starter Growth ($29/mo)'
        }
      });
    }

    req.tenantSubscription = sub;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware for Keyword Auto-Reply access
 */
export async function requireAutoReplyAccess(req, res, next) {
  try {
    const businessId = req.businessId;
    const sub = await getSubscription(businessId);
    const planFeatures = sub?.features || {};

    if (!planFeatures.keyword_auto_replies) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PLAN_FEATURE_LOCKED',
          message: `Keyword Auto-Replies and Bot Triggers are not available on "${sub?.plan_name || 'Free Trial'}". Upgrade to Starter or Pro to enable automated WhatsApp replies.`,
          feature: 'keyword_auto_replies',
          currentPlan: sub?.plan_name || 'Free Trial',
          planId: sub?.plan_id || 1,
          suggestedUpgrade: 'Starter Growth ($29/mo)'
        }
      });
    }

    req.tenantSubscription = sub;
    next();
  } catch (err) {
    next(err);
  }
}

export default {
  requireFeature,
  requireAiAccess,
  requireScheduledBroadcastAccess,
  requireAutoReplyAccess
};
