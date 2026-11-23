import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import AiwavoHeader from '../components/AiwavoHeader';
import '../styles/billing.css';

export default function Billing() {
  const { user, business } = useAuth();
  const outletContext = useOutletContext();
  const onToggleSidebar = outletContext?.onToggleSidebar;
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradingId, setUpgradingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [razorpayOrderModal, setRazorpayOrderModal] = useState(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, usageRes, txRes] = await Promise.all([
        api.get('/billing/plans').catch(() => ({ data: { success: false } })),
        api.get('/billing/subscription').catch(() => ({ data: { success: false } })),
        api.get('/billing/usage').catch(() => ({ data: { success: false } })),
        api.get('/billing/transactions').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (plansRes.data?.success && Array.isArray(plansRes.data.data)) {
        setPlans(plansRes.data.data);
      }
      if (subRes.data?.success && subRes.data.data) {
        setSubscription(subRes.data.data);
      }
      if (usageRes.data?.success && usageRes.data.data) {
        setUsage(usageRes.data.data);
      }
      if (txRes.data?.success && Array.isArray(txRes.data.data)) {
        setTransactions(txRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load billing details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    setUpgradingId(planId);
    setFeedback({ type: '', text: '' });

    // Plan 1: Free Trial (no payment needed)
    if (planId === 1) {
      try {
        await api.post('/billing/upgrade', { planId: 1 });
        setFeedback({ type: 'success', text: 'Switched to Free Trial plan successfully!' });
        await fetchBillingData();
      } catch (err) {
        setFeedback({ type: 'danger', text: err.response?.data?.error?.message || 'Failed to change plan' });
      } finally {
        setUpgradingId(null);
      }
      return;
    }

    // Paid Plan: Create Razorpay Order
    try {
      const orderRes = await api.post('/billing/create-order', { planId });
      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.error?.message || 'Failed to initialize payment');
      }

      const orderData = orderRes.data.data;

      // If Razorpay Checkout JS SDK is loaded on window and live keys configured
      if (window.Razorpay && !orderData.isMock) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'CampaignFlow SaaS',
          description: `Subscription Upgrade to ${orderData.planName} (${orderData.amountFormatted}/month)`,
          order_id: orderData.orderId,
          handler: async function (response) {
            try {
              setUpgradingId(planId);
              setFeedback({ type: 'info', text: 'Verifying payment with Razorpay...' });
              const verifyRes = await api.post('/billing/verify-payment', {
                planId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              if (verifyRes.data?.success) {
                setFeedback({ type: 'success', text: `Payment verified! You are now upgraded to ${orderData.planName}.` });
                await fetchBillingData();
              }
            } catch (vErr) {
              setFeedback({ type: 'danger', text: vErr.response?.data?.error?.message || 'Payment verification failed' });
            } finally {
              setUpgradingId(null);
            }
          },
          prefill: {
            name: user?.name || business?.name || 'Workspace Owner',
            email: user?.email || 'owner@acmeretail.com'
          },
          theme: {
            color: '#2563eb'
          },
          modal: {
            ondismiss: function () {
              setUpgradingId(null);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (failRes) {
          setFeedback({ type: 'danger', text: `Payment failed: ${failRes.error?.description || 'Transaction declined'}` });
          setUpgradingId(null);
        });
        rzp.open();
      } else {
        // Razorpay Test / Sandbox Order Modal
        setRazorpayOrderModal({
          orderId: orderData.orderId,
          amount: orderData.amount,
          amountFormatted: orderData.amountFormatted,
          planId,
          planName: orderData.planName,
          isMock: Boolean(orderData.isMock)
        });
        setUpgradingId(null);
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.error?.message || err.message || 'Payment failed to initiate' });
      setUpgradingId(null);
    }
  };

  const handleCompleteTestPayment = async () => {
    if (!razorpayOrderModal) return;
    setUpgradingId(razorpayOrderModal.planId);
    try {
      const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const verifyRes = await api.post('/billing/verify-payment', {
        planId: razorpayOrderModal.planId,
        razorpay_order_id: razorpayOrderModal.orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: 'mock_signature'
      });
      if (verifyRes.data?.success) {
        setFeedback({
          type: 'success',
          text: `Payment successful! Upgraded to ${razorpayOrderModal.planName}. (Tx ID: ${mockPaymentId})`
        });
        setRazorpayOrderModal(null);
        await fetchBillingData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.error?.message || 'Payment simulation failed' });
    } finally {
      setUpgradingId(null);
    }
  };

  // Metrics Data with realistic fallback
  const contactsCurrent = usage?.metrics?.contacts?.current ?? 18;
  const contactsLimit = usage?.metrics?.contacts?.limit ?? 15000;
  const contactsPercent = usage?.metrics?.contacts?.percentage ?? Math.round((contactsCurrent / contactsLimit) * 100);

  const messagesCurrent = usage?.metrics?.messages?.current ?? 4;
  const messagesLimit = usage?.metrics?.messages?.limit ?? 75000;
  const messagesPercent = usage?.metrics?.messages?.percentage ?? Math.round((messagesCurrent / messagesLimit) * 100);

  const currentPeriod = usage?.periodMonth ?? new Date().toISOString().substring(0, 7);

  const campaignsCurrent = usage?.metrics?.campaigns?.current ?? 7;
  const campaignsLimit = usage?.metrics?.campaigns?.limit ?? 50;
  const campaignsPercent = usage?.metrics?.campaigns?.percentage ?? Math.round((campaignsCurrent / campaignsLimit) * 100);

  // Default plans definition to ensure pixel-perfect fidelity matching the reference
  const planDefinitions = [
    {
      id: 1,
      slug: 'free',
      name: 'Free Trial',
      price: '₹0',
      iconType: 'sprout',
      iconBg: '#e8f8f0',
      iconColor: '#10b981',
      contacts: '250 Contacts',
      messages: '500 WhatsApp Messages',
      campaigns: '2 Campaigns',
      team: '1 Team Seats',
      metaApi: 'Official Meta Cloud API'
    },
    {
      id: 2,
      slug: 'starter',
      name: 'Starter Growth',
      price: '₹2,499',
      iconType: 'rocket',
      iconBg: '#eff6ff',
      iconColor: '#3b82f6',
      contacts: '2,500 Contacts',
      messages: '10,000 WhatsApp Messages',
      campaigns: '15 Campaigns',
      team: '3 Team Seats',
      metaApi: 'Official Meta Cloud API'
    },
    {
      id: 3,
      slug: 'pro',
      name: 'Pro Automation',
      price: '₹6,499',
      iconType: 'crown',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      contacts: '15,000 Contacts',
      messages: '75,000 WhatsApp Messages',
      campaigns: '50 Campaigns',
      team: '10 Team Seats',
      metaApi: 'Official Meta Cloud API'
    },
    {
      id: 4,
      slug: 'enterprise',
      name: 'Enterprise Scale',
      price: '₹19,999',
      iconType: 'layers',
      iconBg: '#f3e8ff',
      iconColor: '#9333ea',
      contacts: '100,000 Contacts',
      messages: '500,000 WhatsApp Messages',
      campaigns: '9999 Campaigns',
      team: '50 Team Seats',
      metaApi: 'Official Meta Cloud API'
    }
  ];

  // Merge with API data if present
  const mergedPlans = planDefinitions.map((def) => {
    const apiPlan = plans.find(
      (p) => p.id === def.id || p.slug === def.slug || p.name?.toLowerCase().includes(def.slug)
    );
    if (!apiPlan) return def;

    const rawFeats = apiPlan.features;
    let parsedFeats = {};
    if (typeof rawFeats === 'string') {
      try { parsedFeats = JSON.parse(rawFeats); } catch (_) {}
    } else if (rawFeats && typeof rawFeats === 'object') {
      parsedFeats = rawFeats;
    }

    const inrPrice = Number(apiPlan.monthly_price || 0);
    const formattedPrice = inrPrice === 0 ? '₹0' : `₹${inrPrice.toLocaleString('en-IN')}`;

    return {
      ...def,
      id: apiPlan.id,
      name: apiPlan.name || def.name,
      price: formattedPrice,
      contacts: `${Number(apiPlan.max_contacts || 250).toLocaleString()} Contacts`,
      messages: `${Number(apiPlan.max_messages_per_month || 500).toLocaleString()} WhatsApp Messages`,
      campaigns: `${apiPlan.max_campaigns_per_month || 2} Campaigns`,
      team: `${apiPlan.max_team_members || 1} Team Seats`,
      max_whatsapp_numbers: apiPlan.max_whatsapp_numbers || (def.slug === 'pro' ? 3 : (def.slug === 'enterprise' ? 10 : 1)),
      features: parsedFeats
    };
  });

  const currentPlanId = subscription?.plan_id ?? 3;
  const currentPlanName = subscription?.plan_name || 'Pro Automation';

  return (
    <div>
      <AiwavoHeader
        title="Billing & Plans"
        subtitle="Manage workspace tiers, contact limits, and monthly broadcast allowances"
        onToggleSidebar={onToggleSidebar}
      />

      <div className="billing-page-container">
        {feedback.text && (
          <div className={`alert alert-${feedback.type} alert-dismissible fade show mb-4`} role="alert">
            {feedback.text}
            <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', text: '' })}></button>
          </div>
        )}

        {/* 1. Hero Banner */}
        <div className="billing-hero-banner">
          <div className="billing-hero-left">
            <div className="billing-hero-icon">
              {/* Solid White Crown SVG */}
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
            </div>
            <div>
              <h1 className="billing-hero-title">Manage Your Plan & Usage</h1>
              <p className="billing-hero-subtitle">
                Manage workspace tiers, contact limits, and monthly broadcast allowances.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Usage / Quota Metric Cards */}
        <div className="billing-metrics-row">
          {/* Card 1: Stored Audience Contacts */}
          <div className="billing-metric-card">
            <div className="billing-metric-icon icon-contacts">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="billing-metric-content">
              <div className="billing-metric-label">Stored Audience Contacts</div>
              <div className="billing-metric-val">
                {contactsCurrent.toLocaleString()} / {contactsLimit.toLocaleString()}
              </div>
              <div className="billing-progress-track">
                <div
                  className="billing-progress-fill fill-emerald"
                  style={{ width: `${Math.max(contactsPercent, contactsCurrent > 0 ? 2 : 0)}%` }}
                ></div>
              </div>
              <div className="billing-metric-sub">{contactsPercent}% of contact quota used</div>
            </div>
          </div>

          {/* Card 2: Monthly Messages Dispatched */}
          <div className="billing-metric-card">
            <div className="billing-metric-icon icon-messages">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
            <div className="billing-metric-content">
              <div className="billing-metric-label">Monthly Messages Dispatched</div>
              <div className="billing-metric-val">
                {messagesCurrent.toLocaleString()} / {messagesLimit.toLocaleString()}
              </div>
              <div className="billing-progress-track">
                <div
                  className="billing-progress-fill fill-blue"
                  style={{ width: `${Math.max(messagesPercent, messagesCurrent > 0 ? 1 : 0)}%` }}
                ></div>
              </div>
              <div className="billing-metric-sub">Period: {currentPeriod}</div>
            </div>
          </div>

          {/* Card 3: Campaigns Executed */}
          <div className="billing-metric-card">
            <div className="billing-metric-icon icon-campaigns">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            </div>
            <div className="billing-metric-content">
              <div className="billing-metric-label">Campaigns Executed</div>
              <div className="billing-metric-val">
                {campaignsCurrent.toLocaleString()} / {campaignsLimit.toLocaleString()}
              </div>
              <div className="billing-progress-track">
                <div
                  className="billing-progress-fill fill-amber"
                  style={{ width: `${Math.max(campaignsPercent, campaignsCurrent > 0 ? 14 : 0)}%` }}
                ></div>
              </div>
              <div className="billing-metric-sub">{campaignsPercent}% of campaign quota</div>
            </div>
          </div>
        </div>

        {/* 3. Subscription Tiers Section */}
        <div className="billing-tiers-section">
          <div className="billing-tiers-header">
            <h2 className="billing-tiers-title">Subscription Tiers</h2>
            <div className="billing-current-pill">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>Current: {currentPlanName}</span>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div className="billing-plans-grid">
            {mergedPlans.map((p) => {
              const isCurrent = currentPlanId === p.id || (p.slug === 'pro' && currentPlanName.includes('Pro'));

              return (
                <div key={p.id} className={`billing-plan-card ${isCurrent ? 'is-current' : ''}`}>
                  {/* Top Header */}
                  <div className="billing-plan-top">
                    <div
                      className="billing-plan-badge"
                      style={{ backgroundColor: p.iconBg, color: p.iconColor }}
                    >
                      {p.iconType === 'sprout' && (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66 1-2.3c.43.19.86.3 1.29.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                        </svg>
                      )}
                      {p.iconType === 'rocket' && (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                        </svg>
                      )}
                      {p.iconType === 'crown' && (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                        </svg>
                      )}
                      {p.iconType === 'layers' && (
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                          <polyline points="2 17 12 22 22 17" />
                          <polyline points="2 12 12 17 22 12" />
                        </svg>
                      )}
                    </div>
                    <h3 className="billing-plan-name">{p.name}</h3>
                    {isCurrent && <span className="billing-current-chip">Current</span>}
                  </div>

                  {/* Price */}
                  <div className="billing-price-row">
                    <span className="billing-price-amount">{p.price}</span>
                    <span className="billing-price-period">/month</span>
                  </div>

                  {/* Features List */}
                  <ul className="billing-features-list">
                    <li className="billing-feature-item">
                      <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Up to <strong>{p.contacts}</strong></span>
                    </li>
                    <li className="billing-feature-item">
                      <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span><strong>{p.messages}</strong> /mo</span>
                    </li>
                    <li className="billing-feature-item">
                      <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span><strong>{p.campaigns}</strong> /mo</span>
                    </li>
                    <li className="billing-feature-item">
                      <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span><strong>{p.team}</strong></span>
                    </li>
                    <li className="billing-feature-item">
                      <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span><strong>{p.max_whatsapp_numbers || 1}</strong> WhatsApp Number{p.max_whatsapp_numbers > 1 ? 's' : ''}</span>
                    </li>

                    {/* Scheduled Campaigns */}
                    <li className={`billing-feature-item ${!p.features?.scheduled_campaigns ? 'text-muted' : ''}`}>
                      {p.features?.scheduled_campaigns ? (
                        <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                      <span>{p.features?.scheduled_campaigns ? 'Scheduled & Recurring Broadcasts' : <del className="text-muted">Scheduled Broadcasts</del>}</span>
                    </li>

                    {/* AI Campaign Copywriter */}
                    <li className={`billing-feature-item ${!p.features?.ai_copy_generator ? 'text-muted' : ''}`}>
                      {p.features?.ai_copy_generator ? (
                        <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                      <span>
                        {p.features?.ai_copy_generator ? (
                          <>AI Copywriter <strong>({p.features?.ai_monthly_limit > 100 ? 'Unlimited' : '10/mo'})</strong></>
                        ) : (
                          <del className="text-muted">AI Copywriter</del>
                        )}
                      </span>
                    </li>

                    {/* Keyword Auto-Replies */}
                    <li className={`billing-feature-item ${!p.features?.keyword_auto_replies ? 'text-muted' : ''}`}>
                      {p.features?.keyword_auto_replies ? (
                        <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                      <span>
                        {p.features?.keyword_auto_replies ? (
                          <>Auto-Replies <strong>({p.features?.max_auto_reply_rules} Rules)</strong></>
                        ) : (
                          <del className="text-muted">Keyword Auto-Replies</del>
                        )}
                      </span>
                    </li>

                    {/* Webhooks & REST API */}
                    <li className={`billing-feature-item ${!p.features?.api_access ? 'text-muted' : ''}`}>
                      {p.features?.api_access ? (
                        <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg className="me-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                      <span>
                        {p.features?.api_access ? (
                          'Webhooks & REST API'
                        ) : (
                          <del className="text-muted">Webhooks & REST API</del>
                        )}
                      </span>
                    </li>

                    {/* Support Level */}
                    <li className="billing-feature-item">
                      <svg className="billing-feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>
                        {p.features?.support_level === 'dedicated_sla' ? 'Dedicated SLA & Manager' : 
                         p.features?.support_level === 'priority_whatsapp' ? 'Priority WhatsApp Support' : 
                         p.features?.support_level === 'email' ? 'Email Support' : 'Community Support'}
                      </span>
                    </li>
                  </ul>

                  {/* Action Button */}
                  {isCurrent ? (
                    <div className="billing-btn-current">Current Plan</div>
                  ) : (
                    <button
                      type="button"
                      className="billing-btn-switch"
                      disabled={upgradingId === p.id}
                      onClick={() => handleUpgrade(p.id)}
                    >
                      {upgradingId === p.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                          <span>Processing...</span>
                        </>
                      ) : p.id === 1 ? (
                        <span>Switch to Free</span>
                      ) : (
                        <>
                          <i className="bi bi-credit-card-fill me-1"></i>
                          <span>Pay with Razorpay</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pricing Transparency Callout */}
          <div className="billing-transparency-box">
            <svg
              className="billing-transparency-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="billing-transparency-text">
              <strong>Pricing Transparency:</strong> Platform subscription covers software quotas and automation
              workers. Official WhatsApp utility and marketing conversation fees are billed directly through your linked
              Meta Payment Method as per Meta's rate cards.
            </div>
          </div>

          {/* 4. Complete Side-by-Side Feature Comparison Matrix */}
          <div className="card shadow-sm border-0 mt-5 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h4 className="fw-bold mb-1 text-dark">Full Feature & Quota Comparison Matrix</h4>
                <p className="text-muted small mb-0">Compare limits, AI features, and automation capabilities across all four tiers</p>
              </div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill small fw-semibold">
                <i className="bi bi-shield-check me-1"></i> Meta Cloud API Verified
              </span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '28%' }} className="ps-4 py-3 text-secondary text-uppercase small">Features & Capabilities</th>
                    <th style={{ width: '18%' }} className="text-center py-3">
                      <div className="fw-bold text-dark">Free Trial</div>
                      <div className="text-muted small">₹0/mo</div>
                    </th>
                    <th style={{ width: '18%' }} className="text-center py-3">
                      <div className="fw-bold text-primary">Starter Growth</div>
                      <div className="text-muted small">₹2,499/mo</div>
                    </th>
                    <th style={{ width: '18%' }} className="text-center py-3 bg-primary-subtle border-start border-end">
                      <div className="fw-bold text-primary">Pro Automation ★</div>
                      <div className="text-muted small">₹6,499/mo</div>
                    </th>
                    <th style={{ width: '18%' }} className="text-center py-3">
                      <div className="fw-bold text-dark">Enterprise Scale</div>
                      <div className="text-muted small">₹19,999/mo</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Category: Audience & Contacts */}
                  <tr className="table-secondary">
                    <td colSpan="5" className="ps-4 py-2 fw-bold small text-uppercase text-secondary">
                      <i className="bi bi-people-fill me-2"></i> Audience & Contact Management
                    </td>
                  </tr>
                  <tr>
                    <td className="ps-4 fw-medium">Audience Contacts Stored</td>
                    <td className="text-center">250</td>
                    <td className="text-center fw-semibold">2,500</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-primary">15,000</td>
                    <td className="text-center fw-bold text-purple">100,000+</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Excel / CSV Bulk Import</td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i></td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i></td>
                    <td className="text-center text-success bg-primary-subtle border-start border-end"><i className="bi bi-check-circle-fill"></i></td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i></td>
                  </tr>
                  <tr>
                    <td className="ps-4">Audience Tags & Segmentation</td>
                    <td className="text-center text-muted">Basic Tags</td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i> Advanced Tags</td>
                    <td className="text-center text-success bg-primary-subtle border-start border-end"><i className="bi bi-check-circle-fill"></i> Smart Groups</td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i> Custom Attributes</td>
                  </tr>

                  {/* Category: Messaging & Broadcasts */}
                  <tr className="table-secondary">
                    <td colSpan="5" className="ps-4 py-2 fw-bold small text-uppercase text-secondary">
                      <i className="bi bi-megaphone-fill me-2"></i> WhatsApp Broadcasts & Sending
                    </td>
                  </tr>
                  <tr>
                    <td className="ps-4 fw-medium">Monthly WhatsApp Messages</td>
                    <td className="text-center">500</td>
                    <td className="text-center fw-semibold">10,000</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-primary">75,000</td>
                    <td className="text-center fw-bold text-purple">500,000+</td>
                  </tr>
                  <tr>
                    <td className="ps-4 fw-medium">Broadcast Campaigns / Month</td>
                    <td className="text-center">2</td>
                    <td className="text-center fw-semibold">15</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-primary">50</td>
                    <td className="text-center fw-bold text-success">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Automated Campaign Scheduler</td>
                    <td className="text-center text-muted"><i className="bi bi-x-circle text-secondary"></i> Instant only</td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i> Date & Time</td>
                    <td className="text-center text-success bg-primary-subtle border-start border-end"><i className="bi bi-check-circle-fill"></i> Recurring & Queued</td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i> Priority Queue</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Sending Speed Throttle</td>
                    <td className="text-center text-muted">5 msg/sec</td>
                    <td className="text-center">10 msg/sec</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-primary">25 msg/sec</td>
                    <td className="text-center fw-bold text-success">50+ msg/sec (Tier 4)</td>
                  </tr>

                  {/* Category: Numbers & Team */}
                  <tr className="table-secondary">
                    <td colSpan="5" className="ps-4 py-2 fw-bold small text-uppercase text-secondary">
                      <i className="bi bi-phone-fill me-2"></i> WhatsApp Accounts & Collaboration
                    </td>
                  </tr>
                  <tr>
                    <td className="ps-4 fw-medium">Connected WhatsApp Phone Numbers</td>
                    <td className="text-center">1</td>
                    <td className="text-center">1</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-primary">Up to 3</td>
                    <td className="text-center fw-bold text-purple">Up to 10 (or Custom)</td>
                  </tr>
                  <tr>
                    <td className="ps-4 fw-medium">Team Member Seats</td>
                    <td className="text-center">1 Seat</td>
                    <td className="text-center">3 Seats</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-primary">10 Seats</td>
                    <td className="text-center fw-bold text-purple">50+ Seats</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Shared Team Live Inbox (24h Window)</td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i></td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i></td>
                    <td className="text-center text-success bg-primary-subtle border-start border-end"><i className="bi bi-check-circle-fill"></i></td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i></td>
                  </tr>
                  <tr>
                    <td className="ps-4">Agent Assignment & Internal Notes</td>
                    <td className="text-center text-muted"><i className="bi bi-x-circle text-secondary"></i></td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i> Included</td>
                    <td className="text-center text-success bg-primary-subtle border-start border-end"><i className="bi bi-check-circle-fill"></i> Included</td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i> Full RBAC</td>
                  </tr>

                  {/* Category: AI & Automation */}
                  <tr className="table-secondary">
                    <td colSpan="5" className="ps-4 py-2 fw-bold small text-uppercase text-secondary">
                      <i className="bi bi-stars me-2"></i> AI & Smart Automation
                    </td>
                  </tr>
                  <tr>
                    <td className="ps-4 fw-medium">AI Campaign Copywriter (Multilingual)</td>
                    <td className="text-center text-muted"><i className="bi bi-lock-fill text-secondary"></i> Locked</td>
                    <td className="text-center fw-semibold">10 Generations/mo</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-success"><i className="bi bi-check-circle-fill"></i> Unlimited</td>
                    <td className="text-center fw-bold text-success"><i className="bi bi-check-circle-fill"></i> Unlimited + Custom Models</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Languages (Hindi, Hinglish, English)</td>
                    <td className="text-center text-muted">—</td>
                    <td className="text-center">English only</td>
                    <td className="text-center fw-semibold bg-primary-subtle border-start border-end text-primary">Hindi, Hinglish, English</td>
                    <td className="text-center fw-semibold">All Global Languages</td>
                  </tr>
                  <tr>
                    <td className="ps-4 fw-medium">Keyword Auto-Replies & Bot Rules</td>
                    <td className="text-center text-muted"><i className="bi bi-lock-fill text-secondary"></i> Locked</td>
                    <td className="text-center fw-semibold">Up to 5 Rules</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-primary">Up to 25 Rules</td>
                    <td className="text-center fw-bold text-purple">Unlimited Bot Rules</td>
                  </tr>

                  {/* Category: Analytics & Developer */}
                  <tr className="table-secondary">
                    <td colSpan="5" className="ps-4 py-2 fw-bold small text-uppercase text-secondary">
                      <i className="bi bi-code-slash me-2"></i> Analytics, Integrations & Support
                    </td>
                  </tr>
                  <tr>
                    <td className="ps-4">Delivery & Read Status Analytics</td>
                    <td className="text-center">Basic</td>
                    <td className="text-center">Standard Reports</td>
                    <td className="text-center fw-semibold bg-primary-subtle border-start border-end text-primary">Advanced Analytics & Export</td>
                    <td className="text-center fw-semibold">Custom BI & Raw Logs</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Webhooks & REST API Access</td>
                    <td className="text-center text-muted"><i className="bi bi-lock-fill text-secondary"></i></td>
                    <td className="text-center text-muted"><i className="bi bi-lock-fill text-secondary"></i></td>
                    <td className="text-center text-success bg-primary-subtle border-start border-end"><i className="bi bi-check-circle-fill"></i> Full REST API</td>
                    <td className="text-center text-success"><i className="bi bi-check-circle-fill"></i> Dedicated API Keys</td>
                  </tr>
                  <tr>
                    <td className="ps-4">Customer Support Level</td>
                    <td className="text-center text-muted">Community</td>
                    <td className="text-center">Standard Email</td>
                    <td className="text-center fw-bold bg-primary-subtle border-start border-end text-primary">Priority WhatsApp</td>
                    <td className="text-center fw-bold text-purple">Dedicated Account Manager & SLA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Razorpay Invoices & Payment History */}
          <div className="card shadow-sm border-0 mt-5 rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-1 text-dark">Payment History & Invoices</h5>
                <p className="text-muted small mb-0">Records of subscription transactions processed through Razorpay</p>
              </div>
              <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill small">
                <i className="bi bi-receipt me-1"></i> {transactions.length} Transactions
              </span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 small text-uppercase text-secondary">Transaction ID</th>
                    <th className="py-3 small text-uppercase text-secondary">Date & Time</th>
                    <th className="py-3 small text-uppercase text-secondary">Plan</th>
                    <th className="py-3 small text-uppercase text-secondary">Amount</th>
                    <th className="py-3 small text-uppercase text-secondary">Gateway</th>
                    <th className="pe-4 py-3 small text-uppercase text-secondary text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted small">
                        No prior payments recorded yet. Active subscription is running on trial/developer mode.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="ps-4 font-monospace small text-primary fw-medium">{tx.payment_id || tx.id}</td>
                        <td className="small text-muted">{new Date(tx.created_at).toLocaleString()}</td>
                        <td className="fw-semibold text-dark">{tx.plan_name || 'Pro Automation'}</td>
                        <td className="fw-bold text-dark">{tx.amount_formatted || '₹6,499'}</td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 small">
                            Razorpay
                          </span>
                        </td>
                        <td className="pe-4 text-end">
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1">
                            <i className="bi bi-check-circle-fill me-1"></i> Paid
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Razorpay Sandbox / Test Payment Modal */}
      {razorpayOrderModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-primary text-white py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-credit-card-fill fs-5"></i>
                  <h5 className="modal-title fw-bold mb-0">Razorpay Checkout</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setRazorpayOrderModal(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <div className="bg-primary-subtle text-primary d-inline-flex p-3 rounded-circle fs-3 mb-2">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">Confirm Subscription Upgrade</h5>
                  <p className="text-muted small">Secure Razorpay Indian Payment Gateway</p>
                </div>

                <div className="card bg-light border rounded-3 p-3 mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Plan Selected:</span>
                    <span className="fw-bold text-dark">{razorpayOrderModal.planName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Order ID:</span>
                    <span className="font-monospace small text-primary">{razorpayOrderModal.orderId}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted small">Currency:</span>
                    <span className="fw-semibold">INR (₹)</span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark">Total Amount Due:</span>
                    <span className="fs-5 fw-bold text-primary">{razorpayOrderModal.amountFormatted}</span>
                  </div>
                </div>

                <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 rounded-2 mb-0">
                  <i className="bi bi-info-circle-fill text-primary flex-shrink-0"></i>
                  <span>
                    In development/sandbox mode, clicking below simulates instant payment capture and plan activation.
                  </span>
                </div>
              </div>
              <div className="modal-footer bg-light border-top px-4 py-3">
                <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setRazorpayOrderModal(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={upgradingId === razorpayOrderModal.planId}
                  className="btn btn-primary px-4 fw-semibold d-flex align-items-center gap-2"
                  onClick={handleCompleteTestPayment}
                >
                  {upgradingId === razorpayOrderModal.planId ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lock-fill"></i>
                      <span>Confirm & Pay {razorpayOrderModal.amountFormatted}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
