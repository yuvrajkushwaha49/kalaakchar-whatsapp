import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../services/api';
import AiwavoHeader from '../components/AiwavoHeader';

export default function AiAssistant() {
  const outletContext = useOutletContext();
  const onToggleSidebar = outletContext?.onToggleSidebar;
  const [formData, setFormData] = useState({
    businessDescription: 'Acme Retail - Premium Fashion & Ethnic Wear',
    productOrService: 'Diwali Festive Kurta & Saree Collection',
    offerDetails: 'Flat 30% OFF + Free Gift on orders above ₹1999',
    targetAudience: 'Returning Festive Shoppers',
    language: 'Hinglish',
    tone: 'Engaging & Urgent'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [planFeatures, setPlanFeatures] = useState(null);
  const [planLockedMsg, setPlanLockedMsg] = useState('');

  useEffect(() => {
    api.get('/billing/features').then(res => {
      if (res.data?.success) {
        setPlanFeatures(res.data.data);
        if (res.data.data.features && !res.data.data.features.ai_copy_generator) {
          setPlanLockedMsg(`AI Campaign Copywriter is not included in your current "${res.data.data.planName}" plan. Upgrade to Starter or Pro to unlock AI copy generation.`);
        }
      }
    }).catch(() => {});
  }, []);

  const isLocked = planFeatures?.features && !planFeatures.features.ai_copy_generator;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (isLocked) {
      setPlanLockedMsg(`AI Campaign Assistant is locked on your current plan. Please upgrade to unlock.`);
      return;
    }
    setLoading(true);
    setPlanLockedMsg('');
    try {
      const res = await api.post('/ai/generate-copy', formData);
      if (res.data?.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      if (err.response?.data?.error?.code === 'PLAN_FEATURE_LOCKED') {
        setPlanLockedMsg(err.response.data.error.message);
      } else {
        alert(err.response?.data?.error?.message || 'Failed to generate copy');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div>
      <AiwavoHeader
        title="AI Campaign Assistant"
        subtitle="Generate high-converting WhatsApp promotional messages in Hindi, Hinglish, and English"
        onToggleSidebar={onToggleSidebar}
      />

      <div className="p-4">
        {planLockedMsg && (
          <div className="alert alert-warning border-warning-subtle shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 rounded-3 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-warning-subtle text-warning p-2 rounded-circle fs-4 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                <i className="bi bi-lock-fill"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-dark">Feature Locked on Current Plan</h6>
                <p className="mb-0 text-secondary small">{planLockedMsg}</p>
              </div>
            </div>
            <Link to="/billing" className="btn btn-warning text-dark fw-semibold px-4 py-2 rounded-pill shadow-sm">
              <i className="bi bi-arrow-up-circle-fill me-1"></i> Upgrade to Unlock
            </Link>
          </div>
        )}

        {planFeatures && !isLocked && (
          <div className="mb-3 d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill small">
              <i className="bi bi-patch-check-fill me-1"></i> Plan: {planFeatures.planName} (AI Copywriter Unlocked)
            </span>
          </div>
        )}

      <div className="row g-4">
        {/* Input Form */}
        <div className="col-12 col-lg-5">
          <div className="cf-card">
            <div className="cf-card-header">
              <h5 className="mb-0">Campaign Copy Prompt</h5>
            </div>
            <div className="cf-card-body">
              <form onSubmit={handleGenerate}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Business Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.businessDescription}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Product or Service</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.productOrService}
                    onChange={(e) => setFormData({ ...formData, productOrService: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Offer Details / Discount</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.offerDetails}
                    onChange={(e) => setFormData({ ...formData, offerDetails: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-semibold">Language</label>
                    <select
                      className="form-select"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    >
                      <option value="Hinglish">Hinglish (Recommended)</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="English">English</option>
                    </select>
                  </div>

                  <div className="col-6">
                    <label className="form-label small fw-semibold">Tone</label>
                    <select
                      className="form-select"
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    >
                      <option value="Engaging & Urgent">Engaging & Urgent</option>
                      <option value="Festive & Joyful">Festive & Joyful</option>
                      <option value="Exclusive VIP">Exclusive VIP</option>
                      <option value="Professional & Direct">Professional & Direct</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Target Audience</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                </div>

                {isLocked ? (
                  <Link
                    to="/billing"
                    className="btn btn-warning w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold text-dark shadow-sm"
                  >
                    <i className="bi bi-lock-fill"></i>
                    <span>Upgrade Plan to Unlock AI</span>
                  </Link>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-cf-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <>
                        <i className="bi bi-stars"></i>
                        <span>Generate Marketing Copy</span>
                      </>
                    )}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Results & Template Preview */}
        <div className="col-12 col-lg-7">
          {result ? (
            <div className="d-flex flex-column gap-3">
              {result.suggestedCopies?.map((copy, idx) => (
                <div key={idx} className="cf-card mb-0">
                  <div className="cf-card-header d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark">{copy.title}</span>
                    <button
                      onClick={() => copyToClipboard(copy.body, idx)}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      {copiedIdx === idx ? '✓ Copied' : 'Copy Text'}
                    </button>
                  </div>
                  <div className="cf-card-body">
                    <div className="wa-bubble mb-3">
                      {copy.header && <div className="wa-header">{copy.header}</div>}
                      <div className="wa-body">{copy.body}</div>
                      {copy.footer && <div className="wa-footer">{copy.footer}</div>}
                      {copy.ctaText && <div className="wa-button">{copy.ctaText}</div>}
                    </div>

                    <div className="p-3 bg-light rounded-3 small">
                      <div className="fw-bold mb-1">Recommended Template Variables:</div>
                      {Object.entries(result.variableSuggestions || {}).map(([key, desc]) => (
                        <div key={key} className="text-muted">
                          <code className="text-dark">{key}</code>: {desc}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="alert alert-info py-2 small d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill"></i>
                <div>
                  <strong>WhatsApp Policy Compliance:</strong> AI suggestions must be mapped to an approved Meta template before broadcast.
                </div>
              </div>
            </div>
          ) : (
            <div className="cf-card text-center py-5">
              <i className="bi bi-stars text-success fs-1 mb-2"></i>
              <h5>AI Promotional Copy Assistant</h5>
              <p className="text-muted small">Fill in your campaign details on the left and click "Generate Marketing Copy".</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
