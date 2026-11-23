import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import AiwavoHeader from '../../components/AiwavoHeader';

export default function AdminAiSupport() {
  const { onToggleSidebar } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'conversations' | 'kb' | 'analytics' | 'settings'

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [kbStatus, setKbStatus] = useState(null);
  const [reindexing, setReindexing] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    model: 'gemini-1.5-flash',
    temperature: 0.3,
    maxOutputTokens: 1000,
    timeoutMs: 30000,
    apiKeyConfigured: false,
    availableModels: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, kbRes, settingsRes, convRes] = await Promise.all([
        api.get('/ai/admin/analytics').catch(() => ({ data: { data: {} } })),
        api.get('/ai/admin/knowledge-base/status').catch(() => ({ data: { data: {} } })),
        api.get('/ai/admin/settings').catch(() => ({ data: { data: {} } })),
        api.get('/ai/admin/conversations?limit=25').catch(() => ({ data: { data: [] } }))
      ]);

      setAnalytics(analyticsRes.data?.data || null);
      setKbStatus(kbRes.data?.data || null);
      if (settingsRes.data?.data) {
        setSettings(prev => ({ ...prev, ...settingsRes.data.data }));
      }
      setConversations(convRes.data?.data || []);
    } catch (err) {
      setFeedback({ type: 'danger', text: 'Failed to load AI administration details' });
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.post('/ai/admin/knowledge-base/reindex');
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          text: `Knowledge Base re-indexed successfully! (${res.data.data.documentsCount} documents, ${res.data.data.chunksCount} chunks)`
        });
        const kbRes = await api.get('/ai/admin/knowledge-base/status');
        setKbStatus(kbRes.data?.data || null);
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.error?.message || 'Re-indexing failed' });
    } finally {
      setReindexing(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSavingSettings(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.post('/ai/admin/settings', {
        ai_chat_enabled: settings.enabled ? 'true' : 'false',
        gemini_model: settings.model,
        gemini_temperature: String(settings.temperature),
        max_output_tokens: String(settings.maxOutputTokens),
        request_timeout_ms: String(settings.timeoutMs)
      });
      if (res.data?.success) {
        setFeedback({ type: 'success', text: 'AI Support settings saved successfully!' });
      }
    } catch (err) {
      setFeedback({ type: 'danger', text: err.response?.data?.error?.message || 'Failed to update AI settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleInspectConversation = async (conv) => {
    setSelectedConv(conv);
    try {
      const res = await api.get(`/ai/conversations/${conv.id}`);
      setConvMessages(res.data?.data || []);
    } catch (_) {
      setConvMessages([]);
    }
  };

  return (
    <div className="admin-page-container p-4">
      <AiwavoHeader
        title="AI Support Management"
        subtitle="Manage Google Gemini assistant, monitor customer support conversations, and index platform knowledge base"
        onToggleSidebar={onToggleSidebar}
      />

      {feedback.text && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show mb-4`} role="alert">
          {feedback.text}
          <button type="button" className="btn-close" onClick={() => setFeedback({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4 bg-white p-2 rounded-3 border shadow-sm">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active bg-primary' : 'text-dark'}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-grid-fill me-1"></i> AI Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'conversations' ? 'active bg-primary' : 'text-dark'}`}
            onClick={() => setActiveTab('conversations')}
          >
            <i className="bi bi-chat-dots-fill me-1"></i> Conversations ({conversations.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'kb' ? 'active bg-primary' : 'text-dark'}`}
            onClick={() => setActiveTab('kb')}
          >
            <i className="bi bi-book-half me-1"></i> Knowledge Base ({kbStatus?.chunksCount || 0} Chunks)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'analytics' ? 'active bg-primary' : 'text-dark'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="bi bi-graph-up-arrow me-1"></i> Usage & Cost
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'settings' ? 'active bg-primary' : 'text-dark'}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="bi bi-sliders me-1"></i> Settings
          </button>
        </li>
      </ul>

      {/* Tab 1: AI Overview */}
      {activeTab === 'overview' && (
        <div>
          {/* Status & Status Banner */}
          <div className="card border-0 shadow-sm rounded-4 mb-4 bg-light">
            <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle p-3 bg-white shadow-sm text-primary">
                  <i className="bi bi-robot fs-2"></i>
                </div>
                <div>
                  <h5 className="fw-bold mb-1">WhatsApp SaaS AI Support Assistant</h5>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${settings.enabled ? 'bg-success' : 'bg-danger'}`}>
                      {settings.enabled ? 'Service Active' : 'Service Disabled'}
                    </span>
                    <span className="badge bg-secondary font-monospace">Model: {settings.model}</span>
                    <span className={`badge ${settings.apiKeyConfigured ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                      {settings.apiKeyConfigured ? 'Gemini API Live' : 'Knowledge Fallback Mode'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-check form-switch fs-5">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={settings.enabled}
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    setSettings(s => ({ ...s, enabled: nextVal }));
                    api.post('/ai/admin/settings', { ai_chat_enabled: nextVal ? 'true' : 'false' });
                  }}
                />
                <label className="form-check-label fs-6 fw-semibold text-muted ms-2">
                  {settings.enabled ? 'AI Chatbot Enabled' : 'AI Chatbot Paused'}
                </label>
              </div>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 p-3 bg-primary-subtle text-primary">
                    <i className="bi bi-chat-left-text-fill fs-4"></i>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Total Conversations</div>
                    <div className="fs-3 fw-bold text-dark">{analytics?.totalConversations || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 p-3 bg-success-subtle text-success">
                    <i className="bi bi-send-check-fill fs-4"></i>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Total Messages</div>
                    <div className="fs-3 fw-bold text-dark">{analytics?.totalMessages || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 p-3 bg-warning-subtle text-warning">
                    <i className="bi bi-hand-thumbs-up-fill fs-4"></i>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Helpful Rating</div>
                    <div className="fs-3 fw-bold text-dark">{analytics?.feedback?.helpfulPercentage || 100}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-3 p-3 bg-purple-subtle text-purple" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                    <i className="bi bi-cash-coin fs-4"></i>
                  </div>
                  <div>
                    <div className="text-muted small fw-medium">Estimated Cost</div>
                    <div className="fs-3 fw-bold text-dark">${analytics?.estimatedCostUsd || '0.000'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Conversations List & Monitoring */}
      {activeTab === 'conversations' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
            <h6 className="mb-0 fw-bold">Recent Customer Support Conversations</h6>
            <button className="btn btn-sm btn-outline-secondary" onClick={fetchInitialData}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3">ID</th>
                  <th>Business / Tenant</th>
                  <th>Customer User</th>
                  <th>Topic / First Query</th>
                  <th>Messages</th>
                  <th>Last Activity</th>
                  <th className="text-end pe-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {conversations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No customer support conversations recorded yet.
                    </td>
                  </tr>
                ) : (
                  conversations.map(c => (
                    <tr key={c.id}>
                      <td className="ps-3 font-monospace small">#{c.id}</td>
                      <td className="fw-semibold">{c.businessName || `Tenant #${c.tenant_id}`}</td>
                      <td>{c.userName || `User #${c.user_id}`}</td>
                      <td>
                        <span className="d-inline-block text-truncate" style={{ maxWidth: '240px' }}>
                          {c.conversation_title || 'General Platform Query'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary px-2 py-1">
                          {c.messageCount || 1} msgs
                        </span>
                      </td>
                      <td className="small text-muted">
                        {new Date(c.updated_at || c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="text-end pe-3">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleInspectConversation(c)}
                        >
                          <i className="bi bi-eye-fill me-1"></i> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Knowledge Base Status */}
      {activeTab === 'kb' && (
        <div>
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div>
                <h5 className="fw-bold mb-1">Official Platform Documentation Index</h5>
                <p className="text-muted small mb-0">
                  Documentation is ingested from <code>/backend/knowledge-base/</code> and indexed into searchable chunks.
                </p>
              </div>
              <button
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleReindex}
                disabled={reindexing}
              >
                {reindexing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Re-indexing Documents...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat"></i>
                    Re-index Knowledge Base
                  </>
                )}
              </button>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3">
                  <div className="text-muted small fw-medium">Total Indexed Documents</div>
                  <div className="fs-2 fw-bold text-dark">{kbStatus?.documentsCount || 0}</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3">
                  <div className="text-muted small fw-medium">Total Search Chunks</div>
                  <div className="fs-2 fw-bold text-primary">{kbStatus?.chunksCount || 0}</div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3">
                  <div className="text-muted small fw-medium">Last Index Timestamp</div>
                  <div className="small fw-bold text-dark mt-2">
                    {kbStatus?.lastIndexedAt ? new Date(kbStatus.lastIndexedAt).toLocaleString() : 'Not yet indexed'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3">Indexed Knowledge Categories</h6>
            <div className="row g-2">
              {kbStatus?.categories && Object.entries(kbStatus.categories).map(([cat, count]) => (
                <div key={cat} className="col-6 col-md-3">
                  <div className="border rounded-3 p-2 d-flex align-items-center justify-content-between">
                    <span className="text-capitalize small fw-semibold">{cat}</span>
                    <span className="badge bg-secondary-subtle text-secondary">{count} chunks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Usage & Cost Analytics */}
      {activeTab === 'analytics' && (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="fw-bold mb-3">Token Consumption Breakdown</h6>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Total Input (Prompt) Tokens:</span>
                <span className="fw-bold font-monospace">{(analytics?.totalInputTokens || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Total Output (Response) Tokens:</span>
                <span className="fw-bold font-monospace">{(analytics?.totalOutputTokens || 0).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Effective Pricing Tier:</span>
                <span className="badge bg-info-subtle text-info font-monospace">{settings.model}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="fw-bold">Total Estimated Cost (USD):</span>
                <span className="fs-5 fw-bold text-success">${analytics?.estimatedCostUsd || '0.000'}</span>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h6 className="fw-bold mb-3">Service Reliability & Feedback</h6>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Total Rated Answers:</span>
                <span className="fw-bold">{analytics?.feedback?.total || 0}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Helpful Ratings (👍):</span>
                <span className="fw-bold text-success">{analytics?.feedback?.helpfulCount || 0}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Unhelpful Ratings (👎):</span>
                <span className="fw-bold text-danger">{analytics?.feedback?.unhelpfulCount || 0}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">Failed AI Requests:</span>
                <span className="fw-bold text-danger">{analytics?.failedRequests || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeTab === 'settings' && (
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ maxWidth: '700px' }}>
          <h5 className="fw-bold mb-3">Google Gemini AI Configuration</h5>
          <form onSubmit={handleSaveSettings}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Model Selection</label>
              <select
                className="form-select"
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              >
                {settings.availableModels.map(m => (
                  <option key={m} value={m}>{m} {m === 'gemini-1.5-flash' ? '(Recommended - Fast & Cost Efficient)' : ''}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Temperature: <span className="text-primary">{settings.temperature}</span> (Lower = more precise & deterministic)
              </label>
              <input
                type="range"
                className="form-range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold">Max Output Tokens</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.maxOutputTokens}
                  onChange={(e) => setSettings({ ...settings, maxOutputTokens: parseInt(e.target.value, 10) })}
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="form-label fw-semibold">Request Timeout (ms)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.timeoutMs}
                  onChange={(e) => setSettings({ ...settings, timeoutMs: parseInt(e.target.value, 10) })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary px-4 py-2"
              disabled={savingSettings}
            >
              {savingSettings ? 'Saving Settings...' : 'Save AI Configuration'}
            </button>
          </form>
        </div>
      )}

      {/* Conversation Detail Modal / Drawer */}
      {selectedConv && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0">
              <div className="modal-header py-3">
                <h6 className="modal-title fw-bold">
                  Support Chat #{selectedConv.id} — {selectedConv.businessName} ({selectedConv.userName})
                </h6>
                <button type="button" className="btn-close" onClick={() => setSelectedConv(null)}></button>
              </div>
              <div className="modal-body p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {convMessages.length === 0 ? (
                  <div className="text-muted text-center py-4">No messages found in this chat.</div>
                ) : (
                  convMessages.map((m, idx) => {
                    const isUser = m.sender_type === 'user';
                    return (
                      <div key={m.id || idx} className={`mb-3 p-3 rounded-3 ${isUser ? 'bg-primary-subtle ms-4' : 'bg-light me-4 border'}`}>
                        <div className="d-flex justify-content-between mb-1 small text-muted">
                          <span className="fw-bold">{isUser ? 'Customer User' : 'WhatsApp SaaS AI Assistant'}</span>
                          <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="small text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                          {m.message_content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="modal-footer py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedConv(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
