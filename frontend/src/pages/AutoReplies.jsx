import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../services/api';
import AiwavoHeader from '../components/AiwavoHeader';

export default function AutoReplies() {
  const outletContext = useOutletContext();
  const onToggleSidebar = outletContext?.onToggleSidebar;

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planFeatures, setPlanFeatures] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    keyword: '',
    match_type: 'contains',
    reply_text: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, featRes] = await Promise.all([
        api.get('/auto-replies').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/billing/features').catch(() => ({ data: { success: false } }))
      ]);

      if (rulesRes.data?.success) {
        setRules(rulesRes.data.data || []);
      }
      if (featRes.data?.success) {
        setPlanFeatures(featRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load auto-replies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      keyword: '',
      match_type: 'contains',
      reply_text: '',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      keyword: rule.keyword || '',
      match_type: rule.match_type || 'contains',
      reply_text: rule.reply_text || '',
      is_active: Boolean(rule.is_active)
    });
    setShowModal(true);
  };

  const handleToggle = async (rule) => {
    try {
      const newStatus = !rule.is_active;
      const res = await api.patch(`/auto-replies/${rule.id}/toggle`, { isActive: newStatus });
      if (res.data?.success) {
        setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: newStatus } : r));
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Failed to update rule status' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this auto-reply rule?')) return;
    try {
      const res = await api.delete(`/auto-replies/${id}`);
      if (res.data?.success) {
        setRules(rules.filter(r => r.id !== id));
        setFeedback({ type: 'success', text: 'Auto-reply rule deleted successfully' });
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Failed to delete rule' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.keyword.trim() || !formData.reply_text.trim()) {
      setFeedback({ type: 'danger', text: 'Keyword and reply message are required.' });
      return;
    }

    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      if (editingRule) {
        const res = await api.put(`/auto-replies/${editingRule.id}`, formData);
        if (res.data?.success) {
          setFeedback({ type: 'success', text: 'Rule updated successfully!' });
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await api.post('/auto-replies', formData);
        if (res.data?.success) {
          setFeedback({ type: 'success', text: 'New auto-reply rule created!' });
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setFeedback({
        type: 'danger',
        text: err.response?.data?.error?.message || 'Failed to save auto-reply rule'
      });
    } finally {
      setSaving(false);
    }
  };

  const isLocked = planFeatures?.features && !planFeatures.features.keyword_auto_replies;
  const maxRules = planFeatures?.features?.max_auto_reply_rules || 0;
  const isAtLimit = !isLocked && maxRules > 0 && rules.length >= maxRules;

  return (
    <div>
      <AiwavoHeader
        title="Keyword Auto-Replies & Bot"
        subtitle="Set up automatic instant WhatsApp responses for frequently asked keywords (Pricing, Offers, Support)"
        onToggleSidebar={onToggleSidebar}
      />

      <div className="p-4">
        {feedback.text && (
          <div className={`alert alert-${feedback.type} alert-dismissible fade show mb-4`} role="alert">
            {feedback.text}
            <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Feature Lock Notice */}
        {isLocked && (
          <div className="alert alert-warning border-warning-subtle shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 rounded-3 p-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-warning-subtle text-warning p-2 rounded-circle fs-4 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                <i className="bi bi-lock-fill"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-dark">Keyword Auto-Replies Locked</h6>
                <p className="mb-0 text-secondary small">
                  Your current "{planFeatures?.planName || 'Free Trial'}" plan does not include automated bot replies. Upgrade to Starter Growth or Pro Automation to enable 24/7 automated replies.
                </p>
              </div>
            </div>
            <Link to="/billing" className="btn btn-warning text-dark fw-semibold px-4 py-2 rounded-pill shadow-sm">
              <i className="bi bi-arrow-up-circle-fill me-1"></i> Upgrade to Unlock
            </Link>
          </div>
        )}

        {/* Top Action Bar */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill small fw-semibold">
              <i className="bi bi-robot me-1"></i> {rules.length} Rules Active
            </span>
            {planFeatures && !isLocked && (
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                Quota: {rules.length} / {maxRules > 100 ? 'Unlimited' : maxRules} Rules ({planFeatures.planName})
              </span>
            )}
          </div>

          {!isLocked ? (
            <button
              onClick={handleOpenCreate}
              disabled={isAtLimit}
              className="btn btn-primary px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2 fw-semibold"
            >
              <i className="bi bi-plus-lg"></i>
              <span>Create Auto-Reply Rule</span>
            </button>
          ) : (
            <Link to="/billing" className="btn btn-outline-warning text-dark px-4 py-2 rounded-pill fw-semibold">
              <i className="bi bi-lock-fill me-1"></i> Upgrade to Create Rule
            </Link>
          )}
        </div>

        {/* Rules List / Cards */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading rules...</span>
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="card shadow-sm border-0 rounded-4 text-center p-5">
            <div className="mb-3">
              <div className="bg-primary-subtle text-primary d-inline-flex p-3 rounded-circle fs-3">
                <i className="bi bi-robot"></i>
              </div>
            </div>
            <h5 className="fw-bold text-dark">No Keyword Auto-Replies Configured</h5>
            <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>
              Create rules to automatically reply when customers type words like "OFFER", "PRICE", or "CATALOG" on WhatsApp.
            </p>
            {!isLocked && (
              <div className="mt-2">
                <button onClick={handleOpenCreate} className="btn btn-primary px-4 py-2 rounded-pill">
                  <i className="bi bi-plus-lg me-1"></i> Create First Rule
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="row g-3">
            {rules.map((rule) => (
              <div key={rule.id} className="col-12 col-md-6 col-xl-4">
                <div className={`card h-100 border shadow-xs rounded-4 p-3 transition-all ${rule.is_active ? 'border-primary-subtle bg-white' : 'bg-light text-muted'}`}>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary text-white px-3 py-2 rounded-pill fw-bold fs-6">
                        {rule.keyword}
                      </span>
                      <span className="badge bg-light text-secondary border small">
                        {rule.match_type === 'exact' ? 'Exact Match' : 'Contains'}
                      </span>
                    </div>

                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={Boolean(rule.is_active)}
                        onChange={() => handleToggle(rule)}
                        title={rule.is_active ? 'Active' : 'Disabled'}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-3 my-2 border flex-grow-1 small text-dark" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                    {rule.reply_text}
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2">
                    <span className="text-muted small">
                      <i className="bi bi-lightning-charge-fill text-warning me-1"></i>
                      Triggered: <strong>{rule.trigger_count || 0} times</strong>
                    </span>

                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(rule)}
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                      >
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rule.id)}
                        className="btn btn-sm btn-outline-danger rounded-circle p-1"
                        style={{ width: 30, height: 30 }}
                        title="Delete Rule"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Rule Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  {editingRule ? 'Edit Auto-Reply Rule' : 'New Keyword Auto-Reply Rule'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Trigger Keyword <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. OFFER, PRICE, MENU, SUPPORT"
                      value={formData.keyword}
                      onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                      required
                    />
                    <div className="form-text small">Case-insensitive. Matching works regardless of capital letters.</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Match Condition</label>
                    <select
                      className="form-select"
                      value={formData.match_type}
                      onChange={(e) => setFormData({ ...formData, match_type: e.target.value })}
                    >
                      <option value="contains">Message Contains Keyword (Recommended)</option>
                      <option value="exact">Exact Message Match</option>
                      <option value="starts_with">Message Starts With Keyword</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">
                      Automated Response Text <span className="text-danger">*</span>
                    </label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Type the message that will be automatically sent to the customer..."
                      value={formData.reply_text}
                      onChange={(e) => setFormData({ ...formData, reply_text: e.target.value })}
                      required
                    ></textarea>
                    <div className="form-text small">Emojis and links (https://...) are supported.</div>
                  </div>

                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="ruleActiveSwitch"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="ruleActiveSwitch">
                      Rule Active & Ready to Trigger
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-top bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary px-4">
                    {saving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Save Rule')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
