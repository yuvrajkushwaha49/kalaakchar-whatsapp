import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getSocket } from '../services/socket';
import api from '../services/api';
import '../styles/floatingProgress.css';

export default function FloatingLiveProgress() {
  const location = useLocation();
  const [activeJobs, setActiveJobs] = useState({ campaign: null, import: null });
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Don't render on public auth pages
  const isAuthPage = ['/login', '/register', '/forgot-password', '/privacy', '/terms'].includes(location.pathname);

  // Initial check on mount to discover already running jobs
  useEffect(() => {
    if (isAuthPage) return;
    checkActiveJobs();
    const interval = setInterval(checkActiveJobs, 12000);
    return () => clearInterval(interval);
  }, [location.pathname, isAuthPage]);

  // Connect to real-time socket events
  useEffect(() => {
    if (isAuthPage) return;

    const socket = getSocket();
    if (!socket) return;

    const onCampaignProgress = (data) => {
      setActiveJobs((prev) => ({
        ...prev,
        campaign: {
          type: 'campaign',
          id: data.campaignId,
          name: data.campaignName || `Campaign #${data.campaignId}`,
          status: data.status || 'running',
          sentCount: Number(data.sentCount || 0),
          failedCount: Number(data.failedCount || 0),
          totalRecipients: Number(data.totalRecipients || 0),
          remainingCount: Number(data.remainingCount ?? Math.max(0, (data.totalRecipients || 0) - ((data.sentCount || 0) + (data.failedCount || 0)))),
          percent: Number(data.percent || 0)
        }
      }));
      setDismissed(false);
    };

    const onCampaignStatus = (data) => {
      if (data.status === 'completed' || data.status === 'cancelled' || data.status === 'failed') {
        setActiveJobs((prev) => {
          if (!prev.campaign) return prev;
          return {
            ...prev,
            campaign: {
              ...prev.campaign,
              status: data.status,
              percent: data.status === 'completed' ? 100 : prev.campaign.percent
            }
          };
        });

        // Auto dismiss completed/cancelled banner after 15 seconds
        setTimeout(() => {
          setActiveJobs((prev) => ({ ...prev, campaign: null }));
        }, 15000);
      } else if (data.status === 'queued' || data.status === 'running') {
        checkActiveJobs();
      }
    };

    const onImportProgress = (data) => {
      setActiveJobs((prev) => ({
        ...prev,
        import: {
          type: 'import',
          id: data.jobId,
          name: data.fileName || `Import Job #${data.jobId}`,
          status: data.status || 'processing',
          sentCount: Number(data.successfulRows || 0),
          failedCount: Number(data.failedRows || 0),
          totalRecipients: Number(data.totalRows || 0),
          remainingCount: Number(data.remainingRows ?? Math.max(0, (data.totalRows || 0) - ((data.processedRows || 0)))),
          percent: Number(data.percent || 0)
        }
      }));
      setDismissed(false);
    };

    const onImportStatus = (data) => {
      if (data.status === 'completed' || data.status === 'cancelled' || data.status === 'failed') {
        setActiveJobs((prev) => {
          if (!prev.import) return prev;
          return {
            ...prev,
            import: {
              ...prev.import,
              status: data.status,
              percent: data.status === 'completed' ? 100 : prev.import.percent
            }
          };
        });

        setTimeout(() => {
          setActiveJobs((prev) => ({ ...prev, import: null }));
        }, 15000);
      }
    };

    socket.on('campaign:progress', onCampaignProgress);
    socket.on('campaign:status_update', onCampaignStatus);
    socket.on('import:progress', onImportProgress);
    socket.on('import:status_update', onImportStatus);

    return () => {
      socket.off('campaign:progress', onCampaignProgress);
      socket.off('campaign:status_update', onCampaignStatus);
      socket.off('import:progress', onImportProgress);
      socket.off('import:status_update', onImportStatus);
    };
  }, [isAuthPage]);

  const checkActiveJobs = async () => {
    try {
      // 1. Check active campaigns
      const campRes = await api.get('/campaigns');
      if (campRes.data?.success && Array.isArray(campRes.data.data)) {
        const runningCamp = campRes.data.data.find(c => c.status === 'running' || c.status === 'queued');
        if (runningCamp) {
          const sent = Number(runningCamp.sent_count || 0);
          const failed = Number(runningCamp.failed_count || 0);
          const total = Number(runningCamp.total_recipients || 1);
          const processed = sent + failed;
          const remaining = Math.max(0, total - processed);
          const pct = Math.min(100, Math.round((processed / total) * 100));

          setActiveJobs(prev => ({
            ...prev,
            campaign: {
              type: 'campaign',
              id: runningCamp.id,
              name: runningCamp.name,
              status: runningCamp.status,
              sentCount: sent,
              failedCount: failed,
              totalRecipients: total,
              remainingCount: remaining,
              percent: pct
            }
          }));
        } else {
          setActiveJobs(prev => (prev.campaign?.status === 'completed' ? prev : { ...prev, campaign: null }));
        }
      }

      // 2. Check active imports
      const impRes = await api.get('/imports', { params: { limit: 5 } });
      const importJobsList = Array.isArray(impRes.data?.data) ? impRes.data.data : impRes.data?.jobs || [];
      const runningImport = importJobsList.find(j => j.status === 'processing' || j.status === 'pending');
      if (runningImport) {
        const successful = Number(runningImport.successful_rows || 0);
        const failed = Number(runningImport.failed_rows || 0);
        const total = Number(runningImport.total_rows || 1);
        const processed = Number(runningImport.processed_rows || successful + failed);
        const remaining = Math.max(0, total - processed);
        const pct = Math.min(100, Math.round((processed / total) * 100));

        setActiveJobs(prev => ({
          ...prev,
          import: {
            type: 'import',
            id: runningImport.id,
            name: runningImport.file_name,
            status: runningImport.status,
            sentCount: successful,
            failedCount: failed,
            totalRecipients: total,
            remainingCount: remaining,
            percent: pct
          }
        }));
      } else {
        setActiveJobs(prev => (prev.import?.status === 'completed' ? prev : { ...prev, import: null }));
      }
    } catch (_) {
      // Ignore background check errors
    }
  };

  const handleCancelJob = async () => {
    if (!currentJob || cancelling) return;
    const kind = isCampaign ? 'Campaign' : 'Import';
    const confirmCancel = window.confirm(`Are you sure you want to stop/cancel this ${kind} ("${currentJob.name}")? Remaining records will not be sent/processed.`);
    if (!confirmCancel) return;

    try {
      setCancelling(true);
      if (isCampaign) {
        await api.post(`/campaigns/${currentJob.id}/cancel`);
        setActiveJobs(prev => ({
          ...prev,
          campaign: prev.campaign ? { ...prev.campaign, status: 'cancelled' } : null
        }));
      } else {
        await api.post(`/imports/${currentJob.id}/cancel`);
        setActiveJobs(prev => ({
          ...prev,
          import: prev.import ? { ...prev.import, status: 'cancelled' } : null
        }));
      }
    } catch (err) {
      alert(`Failed to cancel: ${err.response?.data?.message || err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  if (isAuthPage || dismissed) return null;

  // Prioritize active campaign, then active import
  const currentJob = activeJobs.campaign || activeJobs.import;
  if (!currentJob) return null;

  const isCompleted = currentJob.status === 'completed';
  const isCancelled = currentJob.status === 'cancelled';
  const isCampaign = currentJob.type === 'campaign';

  // Minimized Compact Pill
  if (minimized) {
    return (
      <div
        className="cf-floating-minimized-pill"
        onClick={() => setMinimized(false)}
        title="Click to expand live progress"
      >
        <div className={`cf-pulse-dot ${isCompleted ? 'bg-success' : isCancelled ? 'bg-danger' : ''}`}></div>
        <div className="small fw-bold">
          {isCompleted ? (
            <span className="text-success">
              <i className="bi bi-check-circle-fill me-1"></i>
              {isCampaign ? 'Campaign Completed!' : 'Import Completed!'}
            </span>
          ) : isCancelled ? (
            <span className="text-danger">
              <i className="bi bi-x-circle-fill me-1"></i>
              {isCampaign ? 'Campaign Cancelled' : 'Import Cancelled'}
            </span>
          ) : (
            <span>
              ⚡ {isCampaign ? 'Campaign' : 'Import'}: {currentJob.percent}% ({currentJob.sentCount.toLocaleString()} / {currentJob.totalRecipients.toLocaleString()})
            </span>
          )}
        </div>
        <i className="bi bi-chevron-down text-muted small ms-1"></i>
      </div>
    );
  }

  // Expanded Floating Progress Card
  return (
    <div className="cf-floating-progress-container">
      <div className={`cf-floating-card ${isCompleted ? 'completed' : isCancelled ? 'border-danger-subtle' : ''}`}>
        <div className="cf-floating-top-row">
          <div className="cf-floating-title-area">
            <div className={`cf-pulse-dot ${isCancelled ? 'bg-danger' : ''}`}></div>
            <div>
              <div className="cf-floating-name">
                <i className={`bi ${isCampaign ? 'bi-whatsapp text-success' : 'bi-file-earmark-spreadsheet text-info'}`}></i>
                <span>{currentJob.name}</span>
                {isCompleted && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle ms-2">
                    <i className="bi bi-check-circle-fill me-1"></i> Completed
                  </span>
                )}
                {isCancelled && (
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle ms-2">
                    <i className="bi bi-slash-circle me-1"></i> Cancelled
                  </span>
                )}
              </div>
              <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                {isCancelled
                  ? 'Job cancelled by user. Dispatched stopped.'
                  : isCompleted
                  ? 'All records dispatched successfully'
                  : isCampaign
                  ? 'Streaming WhatsApp messages in background chunks'
                  : 'Ingesting file contacts in background queue'}
              </div>
            </div>
          </div>

          <div className="cf-floating-actions">
            <span className={`cf-floating-percent-badge ${isCancelled ? 'bg-secondary' : ''}`}>
              {isCancelled ? 'Cancelled' : `${currentJob.percent}% Completed`}
            </span>

            {/* Cancel Button when running/queued */}
            {!isCompleted && !isCancelled && (
              <button
                type="button"
                onClick={handleCancelJob}
                disabled={cancelling}
                className="cf-floating-btn cf-floating-btn-cancel"
                title={`Stop/Cancel this ${isCampaign ? 'campaign' : 'import'}`}
              >
                {cancelling ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    <span>Stopping...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-stop-circle text-danger me-1"></i>
                    <span className="text-danger fw-semibold">Cancel</span>
                  </>
                )}
              </button>
            )}

            <Link
              to={isCampaign ? `/campaigns/${currentJob.id}` : '/imports'}
              className="cf-floating-btn"
              title="Open full page details"
            >
              <span>View</span>
              <i className="bi bi-box-arrow-up-right"></i>
            </Link>

            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="cf-floating-btn"
              title="Minimize to floating pill"
            >
              <i className="bi bi-dash-lg"></i>
            </button>

            {(isCompleted || isCancelled) && (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="cf-floating-btn text-danger-subtle"
                title="Dismiss"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="cf-floating-progress-bar-wrap">
          <div
            className="cf-floating-progress-bar-inner"
            style={{ width: `${Math.max(currentJob.percent, 3)}%` }}
          ></div>
        </div>

        {/* Live Metrics Grid ("Kitna ho gaya, kitna baki hai") */}
        <div className="cf-floating-metrics-grid">
          <div className="cf-floating-metric-box">
            <div className="cf-floating-metric-label">
              <i className="bi bi-check2-circle text-success me-1"></i>
              Sent / Done
            </div>
            <div className="cf-floating-metric-val text-success">
              {currentJob.sentCount.toLocaleString()}
            </div>
          </div>

          <div className="cf-floating-metric-box">
            <div className="cf-floating-metric-label">
              <i className="bi bi-hourglass-split text-warning me-1"></i>
              Remaining (Baki Hai)
            </div>
            <div className="cf-floating-metric-val text-warning">
              {currentJob.remainingCount.toLocaleString()}
            </div>
          </div>

          <div className="cf-floating-metric-box">
            <div className="cf-floating-metric-label">
              <i className="bi bi-people-fill text-info me-1"></i>
              Total Recipients
            </div>
            <div className="cf-floating-metric-val">
              {currentJob.totalRecipients.toLocaleString()}
            </div>
          </div>

          <div className="cf-floating-metric-box">
            <div className="cf-floating-metric-label">
              <i className="bi bi-exclamation-triangle text-danger me-1"></i>
              Failed / Skipped
            </div>
            <div className="cf-floating-metric-val text-danger">
              {currentJob.failedCount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

