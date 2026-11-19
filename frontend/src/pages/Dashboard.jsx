import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import AiwavoHeader from '../components/AiwavoHeader';
import iconImg from '../assets/icon.png';
import '../styles/dashboard.css';

/* ================= Skeleton Placeholder Component ================= */
function DashboardSkeleton() {
  return (
    <div className="aiwavo-dashboard-container" aria-busy="true" aria-label="Loading dashboard">
      {/* Header Skeleton */}
      <div className="aiwavo-header">
        <div className="aiwavo-header-left">
          <div className="aiwavo-skeleton" style={{ width: '180px', height: '32px', marginBottom: '8px' }}></div>
          <div className="aiwavo-skeleton" style={{ width: '300px', height: '16px' }}></div>
        </div>
        <div className="aiwavo-header-right">
          <div className="aiwavo-skeleton aiwavo-skeleton-pill" style={{ width: '145px', height: '36px' }}></div>
          <div className="aiwavo-skeleton aiwavo-skeleton-circle" style={{ width: '36px', height: '36px' }}></div>
          <div className="aiwavo-skeleton aiwavo-skeleton-circle" style={{ width: '36px', height: '36px' }}></div>
        </div>
      </div>

      {/* Row 1: Top Row */}
      <div className="aiwavo-dashboard-body">
        <div className="aiwavo-top-row">
          {/* Welcome Card Skeleton */}
          <div className="aiwavo-welcome-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="d-flex align-items-center mb-3">
              <div className="aiwavo-skeleton aiwavo-skeleton-circle me-3" style={{ width: '40px', height: '40px' }}></div>
              <div className="aiwavo-skeleton" style={{ width: '220px', height: '24px' }}></div>
            </div>
            <div className="aiwavo-skeleton mb-2" style={{ width: '85%', height: '14px' }}></div>
            <div className="aiwavo-skeleton" style={{ width: '60%', height: '14px' }}></div>
          </div>

          {/* Quick Actions Card Skeleton */}
          <div className="aiwavo-quick-actions-card">
            <div className="aiwavo-skeleton mb-3" style={{ width: '110px', height: '18px' }}></div>
            <div className="aiwavo-actions-grid">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="d-flex flex-column align-items-center p-2">
                  <div className="aiwavo-skeleton" style={{ width: '42px', height: '42px', borderRadius: '12px', marginBottom: '8px' }}></div>
                  <div className="aiwavo-skeleton" style={{ width: '65px', height: '12px' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: 5 KPI Metric Cards Skeleton */}
        <div className="aiwavo-kpi-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aiwavo-kpi-card">
              <div className="aiwavo-skeleton" style={{ width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0 }}></div>
              <div className="aiwavo-kpi-info" style={{ width: '100%' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="aiwavo-skeleton" style={{ width: '65px', height: '22px' }}></div>
                  <div className="aiwavo-skeleton aiwavo-skeleton-pill" style={{ width: '42px', height: '18px' }}></div>
                </div>
                <div className="aiwavo-skeleton" style={{ width: '90px', height: '13px' }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: Campaigns Pair Skeleton (Trend + Delivery Overview) */}
        <div className="aiwavo-charts-row-pair">
          {/* Chart 1: Campaigns Trend */}
          <div className="aiwavo-chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="aiwavo-skeleton" style={{ width: '190px', height: '18px' }}></div>
              <div className="aiwavo-skeleton" style={{ width: '120px', height: '14px' }}></div>
            </div>
            <div className="aiwavo-skeleton aiwavo-skeleton-block" style={{ height: '210px', borderRadius: '12px' }}></div>
          </div>

          {/* Chart 2: Campaigns Delivery Overview Donut */}
          <div className="aiwavo-chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="aiwavo-skeleton" style={{ width: '140px', height: '18px' }}></div>
              <div className="aiwavo-skeleton aiwavo-skeleton-pill" style={{ width: '60px', height: '16px' }}></div>
            </div>
            <div className="d-flex align-items-center justify-content-around py-3">
              <div className="aiwavo-skeleton aiwavo-skeleton-circle" style={{ width: '130px', height: '130px' }}></div>
              <div className="d-flex flex-column gap-2" style={{ width: '110px' }}>
                <div className="aiwavo-skeleton" style={{ width: '100%', height: '14px' }}></div>
                <div className="aiwavo-skeleton" style={{ width: '80%', height: '14px' }}></div>
                <div className="aiwavo-skeleton" style={{ width: '90%', height: '14px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3b: All Messages Pair Skeleton (Trend + Delivery Overview) */}
        <div className="aiwavo-charts-row-pair">
          {/* Chart 3: All Messages Trend */}
          <div className="aiwavo-chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="aiwavo-skeleton" style={{ width: '200px', height: '18px' }}></div>
              <div className="aiwavo-skeleton" style={{ width: '150px', height: '14px' }}></div>
            </div>
            <div className="aiwavo-skeleton aiwavo-skeleton-block" style={{ height: '210px', borderRadius: '12px' }}></div>
          </div>

          {/* Chart 4: All Messages Delivery Overview Donut */}
          <div className="aiwavo-chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="aiwavo-skeleton" style={{ width: '140px', height: '18px' }}></div>
              <div className="aiwavo-skeleton aiwavo-skeleton-pill" style={{ width: '60px', height: '16px' }}></div>
            </div>
            <div className="d-flex align-items-center justify-content-around py-3">
              <div className="aiwavo-skeleton aiwavo-skeleton-circle" style={{ width: '130px', height: '130px' }}></div>
              <div className="d-flex flex-column gap-2" style={{ width: '110px' }}>
                <div className="aiwavo-skeleton" style={{ width: '100%', height: '14px' }}></div>
                <div className="aiwavo-skeleton" style={{ width: '80%', height: '14px' }}></div>
                <div className="aiwavo-skeleton" style={{ width: '90%', height: '14px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3c: Contact Growth Skeleton */}
        <div className="aiwavo-chart-row-full">
          <div className="aiwavo-chart-card">
            <div className="aiwavo-skeleton mb-3" style={{ width: '140px', height: '18px' }}></div>
            <div className="aiwavo-skeleton aiwavo-skeleton-block" style={{ height: '190px', borderRadius: '12px' }}></div>
          </div>
        </div>

        {/* Row 4: 3 Section Cards Skeleton */}
        <div className="aiwavo-sections-row">
          {[1, 2, 3].map((cardIdx) => (
            <div key={cardIdx} className="aiwavo-section-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="aiwavo-skeleton" style={{ width: '150px', height: '18px' }}></div>
                <div className="aiwavo-skeleton" style={{ width: '60px', height: '14px' }}></div>
              </div>
              <div className="d-flex flex-column gap-3">
                {[1, 2, 3].map((rowIdx) => (
                  <div key={rowIdx} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <div className="aiwavo-skeleton aiwavo-skeleton-circle" style={{ width: '36px', height: '36px' }}></div>
                      <div className="d-flex flex-column gap-1">
                        <div className="aiwavo-skeleton" style={{ width: '110px', height: '14px' }}></div>
                        <div className="aiwavo-skeleton" style={{ width: '80px', height: '11px' }}></div>
                      </div>
                    </div>
                    <div className="aiwavo-skeleton aiwavo-skeleton-pill" style={{ width: '70px', height: '22px' }}></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Row 5: Bottom Row Skeleton */}
        <div className="aiwavo-bottom-row">
          {/* Recent Campaigns Table Skeleton */}
          <div className="aiwavo-section-card" style={{ flex: '1 1 65%' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="aiwavo-skeleton" style={{ width: '160px', height: '18px' }}></div>
              <div className="aiwavo-skeleton" style={{ width: '60px', height: '14px' }}></div>
            </div>
            <div className="d-flex flex-column gap-3">
              {[1, 2, 3, 4].map((r) => (
                <div key={r} className="d-flex justify-content-between align-items-center py-1">
                  <div className="aiwavo-skeleton" style={{ width: '140px', height: '15px' }}></div>
                  <div className="aiwavo-skeleton aiwavo-skeleton-pill" style={{ width: '75px', height: '20px' }}></div>
                  <div className="aiwavo-skeleton" style={{ width: '60px', height: '15px' }}></div>
                  <div className="aiwavo-skeleton" style={{ width: '60px', height: '15px' }}></div>
                  <div className="aiwavo-skeleton" style={{ width: '90px', height: '15px' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health Skeleton */}
          <div className="aiwavo-section-card" style={{ flex: '1 1 30%' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="aiwavo-skeleton" style={{ width: '130px', height: '18px' }}></div>
              <div className="aiwavo-skeleton aiwavo-skeleton-pill" style={{ width: '80px', height: '20px' }}></div>
            </div>
            <div className="d-flex flex-column gap-3">
              {[1, 2, 3].map((h) => (
                <div key={h} className="d-flex justify-content-between align-items-center">
                  <div className="aiwavo-skeleton" style={{ width: '100px', height: '14px' }}></div>
                  <div className="aiwavo-skeleton aiwavo-skeleton-pill" style={{ width: '70px', height: '20px' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent';
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const onToggleSidebar = outletContext?.onToggleSidebar;
  const sidebarOpen = outletContext?.sidebarOpen;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('Last 7 Days');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await api.get('/analytics/dashboard', {
        params: { timeRange }
      });
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
      if (isManual) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  }, [timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Yuv';
  const userInitials = user?.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'YG';

  // Loading state guard: render animated Skeleton placeholder layout while database data is being fetched
  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  // KPI Metrics (dynamic from database)
  const totalContacts = stats?.kpi?.totalContacts ?? 0;
  const contactsGrowth = stats?.kpi?.contactsGrowth ?? '+0%';
  const messagesSent = stats?.kpi?.messagesSent ?? 0;
  const messagesSentGrowth = stats?.kpi?.messagesSentGrowth ?? '+0%';
  const totalCampaigns = stats?.kpi?.totalCampaigns ?? 0;
  const campaignsGrowth = stats?.kpi?.campaignsGrowth ?? '+0%';
  const activeAutomations = stats?.kpi?.activeAutomations ?? 0;
  const failedMessages = stats?.kpi?.failedMessages ?? 0;
  const failedMessagesGrowth = stats?.kpi?.failedMessagesGrowth ?? '+0%';

  // Trend & Chart Data
  const deliveryTrendData = stats?.deliveryTrend || [];
  const allMessagesTrendData = stats?.allMessagesTrend || [];

  // Campaigns Delivery Overview (Donut chart data)
  const overviewBreakdown = stats?.deliveryOverview?.breakdown || [
    { name: 'Delivered', pct: 0, count: 0, color: '#10b981' },
    { name: 'Sent', pct: 0, count: 0, color: '#3b82f6' },
    { name: 'Failed', pct: 0, count: 0, color: '#ef4444' }
  ];
  const overviewTotal = stats?.deliveryOverview?.total ?? 0;

  // All Messages Delivery Overview (Donut chart data for combined traffic)
  const allOverviewBreakdown = stats?.allMessagesOverview?.breakdown || [
    { name: 'Delivered', pct: 0, count: 0, color: '#10b981' },
    { name: 'Sent', pct: 0, count: 0, color: '#3b82f6' },
    { name: 'Received', pct: 0, count: 0, color: '#8b5cf6' },
    { name: 'Failed', pct: 0, count: 0, color: '#ef4444' }
  ];
  const allOverviewTotal = stats?.allMessagesOverview?.total ?? 0;

  // Contact Growth Data
  const contactGrowthData = stats?.contactGrowth || [];

  // WhatsApp Accounts
  const whatsappAccountsSummary = stats?.whatsappAccounts?.summary || '0 Connected';
  const whatsappAccountsList = stats?.whatsappAccounts?.list || [];

  // Automations List (from MySQL)
  const automationsList = stats?.automations || [];

  // Scheduled Campaigns (from MySQL)
  const scheduledCampaigns = stats?.scheduledCampaigns || [];

  // Recent Campaigns Table (from MySQL)
  const recentCampaigns = stats?.recentCampaigns || [];

  // Recent Assigned Conversations (for Agents)
  const recentConversations = stats?.recentConversations || [];

  // System Health (from MySQL & services)
  const systemHealth = stats?.systemHealth || {
    operational: true,
    whatsapp: 'Connecting...',
    automation: 'Running',
    system: 'All Good'
  };

  return (
    <div className="aiwavo-dashboard-container">
      {/* ================= Top Header ================= */}
      <AiwavoHeader
        title="Dashboard"
        subtitle="Your WhatsApp automation overview and performance."
        onToggleSidebar={onToggleSidebar}
        showDateSelector={true}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        onNotificationClick={() => fetchDashboardData(true)}
      />

      {/* ================= Row 1: Welcome Banner & Quick Actions ================= */}
      <div className="aiwavo-dashboard-body">
        <div className="aiwavo-top-row">
          {/* Welcome Card */}
          <div className="aiwavo-welcome-card">
            <div className="aiwavo-welcome-content">
              <h2 className="aiwavo-welcome-title">👋 Welcome back, {firstName}!</h2>
              <p className="aiwavo-welcome-text">
                {isAgent
                  ? 'Manage customer inquiries, active support chats, and customer communications.'
                  : 'Manage your WhatsApp campaigns, automations and contacts from one place.'}
              </p>
            </div>
            <div className="aiwavo-welcome-icon-wrap">
              <img src={iconImg} alt="Aiveexa" className="aiwavo-welcome-infinity-icon" />
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="aiwavo-quick-actions-card">
            <h3 className="aiwavo-card-title">Quick Actions</h3>
            {isAgent ? (
              <div className="aiwavo-actions-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <Link to="/inbox" className="aiwavo-action-item action-send">
                  <div className="aiwavo-action-icon-wrap">
                    <i className="bi bi-chat-left-dots-fill"></i>
                  </div>
                  <span className="aiwavo-action-label">Open Inbox</span>
                </Link>

                <Link to="/inbox" className="aiwavo-action-item action-campaign">
                  <div className="aiwavo-action-icon-wrap">
                    <i className="bi bi-person-check-fill"></i>
                  </div>
                  <span className="aiwavo-action-label">My Chats</span>
                </Link>

                <Link to="/contacts" className="aiwavo-action-item action-excel">
                  <div className="aiwavo-action-icon-wrap">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <span className="aiwavo-action-label">Contacts</span>
                </Link>
              </div>
            ) : (
              <div className="aiwavo-actions-grid">
                <Link to="/campaigns/new" className="aiwavo-action-item action-send">
                  <div className="aiwavo-action-icon-wrap">
                    <i className="bi bi-send-fill"></i>
                  </div>
                  <span className="aiwavo-action-label">Send Message</span>
                </Link>

                <Link to="/campaigns/new" className="aiwavo-action-item action-campaign">
                  <div className="aiwavo-action-icon-wrap">
                    <i className="bi bi-layers-fill"></i>
                  </div>
                  <span className="aiwavo-action-label">Create Campaign</span>
                </Link>

                <Link to="/imports" className="aiwavo-action-item action-excel">
                  <div className="aiwavo-action-icon-wrap">
                    <i className="bi bi-file-earmark-excel-fill"></i>
                  </div>
                  <span className="aiwavo-action-label">Import Excel</span>
                </Link>

                <Link to="/campaigns" className="aiwavo-action-item action-automation">
                  <div className="aiwavo-action-icon-wrap">
                    <i className="bi bi-diagram-3-fill"></i>
                  </div>
                  <span className="aiwavo-action-label">Create Automation</span>
                </Link>

                <Link to="/whatsapp" className="aiwavo-action-item action-whatsapp">
                  <div className="aiwavo-action-icon-wrap">
                    <i className="bi bi-whatsapp"></i>
                  </div>
                  <span className="aiwavo-action-label">Connect WhatsApp</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ================= Row 2: 5 KPI Metric Cards ================= */}
        <div className="aiwavo-kpi-grid">
          {/* 1. Total Contacts */}
          <div className="aiwavo-kpi-card">
            <div className="aiwavo-kpi-icon kpi-icon-contacts">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="aiwavo-kpi-info">
              <div className="aiwavo-kpi-top">
                <span className="aiwavo-kpi-value">{totalContacts.toLocaleString()}</span>
                <span className="aiwavo-kpi-badge badge-green">↑ {contactsGrowth}</span>
              </div>
              <span className="aiwavo-kpi-label">{isAgent ? 'Assigned Contacts' : 'Total Contacts'}</span>
            </div>
          </div>

          {/* 2. Messages Sent */}
          <div className="aiwavo-kpi-card">
            <div className="aiwavo-kpi-icon kpi-icon-messages">
              <i className="bi bi-whatsapp"></i>
            </div>
            <div className="aiwavo-kpi-info">
              <div className="aiwavo-kpi-top">
                <span className="aiwavo-kpi-value">{messagesSent.toLocaleString()}</span>
                <span className="aiwavo-kpi-badge badge-green">↑ {messagesSentGrowth}</span>
              </div>
              <span className="aiwavo-kpi-label">{isAgent ? 'My Messages Sent' : 'Messages Sent'}</span>
            </div>
          </div>

          {/* 3. Total Campaigns / Assigned Chats */}
          <div className="aiwavo-kpi-card">
            <div className={`aiwavo-kpi-icon ${isAgent ? 'kpi-icon-contacts' : 'kpi-icon-campaigns'}`}>
              <i className={`bi ${isAgent ? 'bi-chat-left-dots-fill' : 'bi-stack'}`}></i>
            </div>
            <div className="aiwavo-kpi-info">
              <div className="aiwavo-kpi-top">
                <span className="aiwavo-kpi-value">{totalCampaigns.toLocaleString()}</span>
                <span className="aiwavo-kpi-badge badge-green">{isAgent ? campaignsGrowth : `↑ ${campaignsGrowth}`}</span>
              </div>
              <span className="aiwavo-kpi-label">{isAgent ? 'Assigned Chats' : 'Total Campaigns'}</span>
            </div>
          </div>

          {/* 4. Active Automations / Resolved Chats */}
          <div className="aiwavo-kpi-card">
            <div className={`aiwavo-kpi-icon ${isAgent ? 'kpi-icon-messages' : 'kpi-icon-automations'}`}>
              <i className={`bi ${isAgent ? 'bi-check-circle-fill' : 'bi-diagram-3-fill'}`}></i>
            </div>
            <div className="aiwavo-kpi-info">
              <div className="aiwavo-kpi-top">
                <span className="aiwavo-kpi-value">{activeAutomations.toLocaleString()}</span>
                {isAgent && <span className="aiwavo-kpi-badge badge-green">Closed</span>}
              </div>
              <span className="aiwavo-kpi-label">{isAgent ? 'Resolved Chats' : 'Active Automations'}</span>
            </div>
          </div>

          {/* 5. Failed Messages */}
          <div className="aiwavo-kpi-card">
            <div className="aiwavo-kpi-icon kpi-icon-failed">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="aiwavo-kpi-info">
              <div className="aiwavo-kpi-top">
                <span className="aiwavo-kpi-value">{failedMessages.toLocaleString()}</span>
                <span className="aiwavo-kpi-badge badge-red">{isAgent ? `${failedMessages} Total` : `↑ ${failedMessagesGrowth}`}</span>
              </div>
              <span className="aiwavo-kpi-label">Failed Messages</span>
            </div>
          </div>
        </div>

        {/* ================= Row 3: Campaigns Pair (Trend + Delivery Overview) ================= */}
        <div className="aiwavo-charts-row-pair">
          {/* Chart 1: Campaigns Delivery Trend */}
          <div className="aiwavo-chart-card">
            <div className="aiwavo-chart-header">
              <div className="d-flex align-items-center gap-2">
                <h3 className="aiwavo-chart-title">
                  <i className="bi bi-bar-chart-fill aiwavo-chart-title-icon"></i>
                  {isAgent ? 'Support Messages Trend' : 'Campaigns Delivery Trend'}
                </h3>
                <span className="aiwavo-chart-badge aiwavo-chart-badge-campaigns">
                  {isAgent ? 'Support' : 'Campaigns'}
                </span>
              </div>
              <div className="aiwavo-legend-row">
                <div>
                  <span className="aiwavo-legend-dot aiwavo-legend-dot-sent"></span>
                  <span>Sent</span>
                </div>
                <div>
                  <span className="aiwavo-legend-dot aiwavo-legend-dot-delivered"></span>
                  <span>Delivered</span>
                </div>
                <div>
                  <span className="aiwavo-legend-dot aiwavo-legend-dot-failed"></span>
                  <span>Failed</span>
                </div>
              </div>
            </div>
            <div className="aiwavo-chart-h210">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={deliveryTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSentAiwavo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDeliveredAiwavo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorFailedAiwavo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `${val / 1000}K` : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="sent"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSentAiwavo)"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="delivered"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDeliveredAiwavo)"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFailedAiwavo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Campaigns Delivery Overview (Donut Chart) */}
          <div className="aiwavo-chart-card">
            <div className="aiwavo-chart-header">
              <div className="d-flex align-items-center gap-2">
                <h3 className="aiwavo-chart-title">{isAgent ? 'Support Delivery Overview' : 'Delivery Overview'}</h3>
                <span className="aiwavo-chart-badge aiwavo-chart-badge-campaigns">{isAgent ? 'Inbox' : 'Campaigns'}</span>
              </div>
            </div>
            <div className="aiwavo-donut-container">
              <div className="aiwavo-donut-wrapper">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={overviewTotal > 0 ? overviewBreakdown : [{ name: 'No Messages', pct: 100, count: 0, color: '#e2e8f0' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={63}
                      dataKey="pct"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {(overviewTotal > 0 ? overviewBreakdown : [{ color: '#e2e8f0' }]).map((entry, index) => (
                        <Cell key={`donut-camp-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="aiwavo-donut-center">
                  <div className="aiwavo-donut-number">{overviewTotal.toLocaleString()}</div>
                  <div className="aiwavo-donut-subtext">Message</div>
                </div>
              </div>

              <div className="aiwavo-donut-legend">
                {overviewBreakdown.map((item, idx) => (
                  <div key={`legend-camp-${idx}`} className="aiwavo-donut-legend-item">
                    <div className="aiwavo-donut-legend-left">
                      <span
                        className="aiwavo-legend-dot"
                        style={{ background: item.color }}
                      ></span>
                      <span>{item.name}</span>
                    </div>
                    <div className="aiwavo-donut-legend-val">
                      {item.pct}% ({item.count.toLocaleString()})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= Row 3b: All Messages Pair (Trend + Delivery Overview) ================= */}
        <div className="aiwavo-charts-row-pair">
          {/* Chart 3: All Messages Delivery Trend */}
          <div className="aiwavo-chart-card">
            <div className="aiwavo-chart-header">
              <div className="d-flex align-items-center gap-2">
                <h3 className="aiwavo-chart-title">
                  <i className="bi bi-chat-square-text-fill aiwavo-chart-title-icon"></i>
                  All Messages Delivery Trend
                </h3>
                <span className="aiwavo-chart-badge aiwavo-chart-badge-all">All Traffic</span>
              </div>
              <div className="aiwavo-legend-row">
                <div>
                  <span className="aiwavo-legend-dot aiwavo-legend-dot-sent"></span>
                  <span>Sent</span>
                </div>
                <div>
                  <span className="aiwavo-legend-dot aiwavo-legend-dot-delivered"></span>
                  <span>Delivered</span>
                </div>
                <div>
                  <span className="aiwavo-legend-dot aiwavo-legend-dot-received"></span>
                  <span>Received</span>
                </div>
                <div>
                  <span className="aiwavo-legend-dot aiwavo-legend-dot-failed"></span>
                  <span>Failed</span>
                </div>
              </div>
            </div>
            <div className="aiwavo-chart-h210">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={allMessagesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAllSentAiwavo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAllDeliveredAiwavo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAllReceivedAiwavo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorAllFailedAiwavo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `${val / 1000}K` : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="sent"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAllSentAiwavo)"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="delivered"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAllDeliveredAiwavo)"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="received"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAllReceivedAiwavo)"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAllFailedAiwavo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: All Messages Delivery Overview (Donut Chart) */}
          <div className="aiwavo-chart-card">
            <div className="aiwavo-chart-header">
              <div className="d-flex align-items-center gap-2">
                <h3 className="aiwavo-chart-title">Delivery Overview</h3>
                <span className="aiwavo-chart-badge aiwavo-chart-badge-all">All Traffic</span>
              </div>
            </div>
            <div className="aiwavo-donut-container">
              <div className="aiwavo-donut-wrapper">
                <ResponsiveContainer width={130} height={130}>
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={allOverviewTotal > 0 ? allOverviewBreakdown : [{ name: 'No Messages', pct: 100, count: 0, color: '#e2e8f0' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={63}
                      dataKey="pct"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {(allOverviewTotal > 0 ? allOverviewBreakdown : [{ color: '#e2e8f0' }]).map((entry, index) => (
                        <Cell key={`donut-all-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="aiwavo-donut-center">
                  <div className="aiwavo-donut-number">{allOverviewTotal.toLocaleString()}</div>
                  <div className="aiwavo-donut-subtext">Message</div>
                </div>
              </div>

              <div className="aiwavo-donut-legend">
                {allOverviewBreakdown.map((item, idx) => (
                  <div key={`legend-all-${idx}`} className="aiwavo-donut-legend-item">
                    <div className="aiwavo-donut-legend-left">
                      <span
                        className="aiwavo-legend-dot"
                        style={{ background: item.color }}
                      ></span>
                      <span>{item.name}</span>
                    </div>
                    <div className="aiwavo-donut-legend-val">
                      {item.pct}% ({item.count.toLocaleString()})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= Row 3c: Contact Growth ================= */}
        <div className="aiwavo-chart-row-full">
          <div className="aiwavo-chart-card">
            <div className="aiwavo-chart-header">
              <div className="d-flex align-items-center gap-2">
                <h3 className="aiwavo-chart-title">
                  <i className="bi bi-megaphone-fill aiwavo-chart-title-icon"></i>
                  Contact Growth
                </h3>
                <span className="aiwavo-chart-badge aiwavo-chart-badge-campaigns">Audience</span>
              </div>
            </div>
            <div className="aiwavo-chart-h190">
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={contactGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrowthAiwavo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    tickFormatter={(val) => (val >= 1000 ? `${val / 1000}K` : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="contacts"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                    fillOpacity={1}
                    fill="url(#colorGrowthAiwavo)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ================= Row 4: 3 Section Cards ================= */}
        <div className="aiwavo-sections-row">
          {/* Card 1: WhatsApp Accounts / Channels */}
          <div className="aiwavo-section-card">
            <div className="aiwavo-section-header">
              <h3 className="aiwavo-section-title">
                <i className="bi bi-whatsapp text-success"></i>
                {isAgent ? 'WhatsApp Channels' : `WhatsApp Accounts (${whatsappAccountsSummary})`}
              </h3>
              {!isAgent && (
                <Link to="/whatsapp" className="aiwavo-section-link">
                  Manage <i className="bi bi-arrow-right"></i>
                </Link>
              )}
            </div>
            <div className="aiwavo-list-container">
              {whatsappAccountsList.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-whatsapp fs-3 d-block mb-1 text-secondary opacity-50"></i>
                  <span className="small">No WhatsApp channels active</span>
                </div>
              ) : (
                whatsappAccountsList.map((acc, idx) => (
                  <div key={`waba-${acc.id || idx}`} className="aiwavo-list-item">
                    <div className="aiwavo-list-left">
                      <div
                        className={`aiwavo-item-icon ${acc.status === 'Connected' ? 'icon-whatsapp' : 'icon-whatsapp-gray'
                          }`}
                      >
                        <i className="bi bi-whatsapp"></i>
                      </div>
                      <div className="aiwavo-item-info">
                        <span className="aiwavo-item-name">{acc.name}</span>
                        <span className="aiwavo-item-subtext">{acc.phone}</span>
                      </div>
                    </div>
                    <div className="aiwavo-list-right">
                      <span
                        className={`aiwavo-status-pill ${acc.status === 'Connected' ? 'status-connected' : 'status-disconnected'
                          }`}
                      >
                        <span
                          className="aiwavo-legend-dot"
                          style={{
                            background: acc.status === 'Connected' ? '#10b981' : '#f59e0b',
                            marginRight: '0.2rem'
                          }}
                        ></span>
                        {acc.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Automation Activity (or Support Queue for Agent) */}
          <div className="aiwavo-section-card">
            <div className="aiwavo-section-header">
              <h3 className="aiwavo-section-title">
                <i className={`bi ${isAgent ? 'bi-chat-left-dots-fill text-primary' : 'bi-diagram-3 text-success'}`}></i>
                {isAgent ? 'My Support Queue' : 'Automation Activity'}
              </h3>
              <Link to={isAgent ? '/inbox' : '/campaigns'} className="aiwavo-section-link">
                {isAgent ? 'Open Inbox' : 'View All'} <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            {isAgent ? (
              <div className="aiwavo-list-container">
                <div className="aiwavo-list-item aiwavo-clickable-item" onClick={() => navigate('/inbox')} role="button" tabIndex={0}>
                  <div className="aiwavo-list-left">
                    <div className="aiwavo-item-icon icon-send">
                      <i className="bi bi-chat-dots-fill"></i>
                    </div>
                    <div className="aiwavo-item-info">
                      <span className="aiwavo-item-name">Open Conversations</span>
                      <span className="aiwavo-item-subtext">Active support chats assigned to you</span>
                    </div>
                  </div>
                  <div className="aiwavo-list-right">
                    <span className="badge bg-primary rounded-pill px-2 py-1">{stats?.kpi?.openChats ?? 0}</span>
                  </div>
                </div>

                <div className="aiwavo-list-item aiwavo-clickable-item" onClick={() => navigate('/inbox?filter=unread')} role="button" tabIndex={0}>
                  <div className="aiwavo-list-left">
                    <div className="aiwavo-item-icon icon-failed">
                      <i className="bi bi-envelope-exclamation-fill"></i>
                    </div>
                    <div className="aiwavo-item-info">
                      <span className="aiwavo-item-name">Unread Customer Inquiries</span>
                      <span className="aiwavo-item-subtext">Customer messages waiting for response</span>
                    </div>
                  </div>
                  <div className="aiwavo-list-right">
                    <span className="badge bg-danger rounded-pill px-2 py-1">{stats?.kpi?.unreadChats ?? 0}</span>
                  </div>
                </div>

                <div className="aiwavo-list-item aiwavo-clickable-item" onClick={() => navigate('/inbox')} role="button" tabIndex={0}>
                  <div className="aiwavo-list-left">
                    <div className="aiwavo-item-icon icon-whatsapp">
                      <i className="bi bi-clock-history"></i>
                    </div>
                    <div className="aiwavo-item-info">
                      <span className="aiwavo-item-name">24-Hour Windows Open</span>
                      <span className="aiwavo-item-subtext">Direct 2-way live messaging permitted</span>
                    </div>
                  </div>
                  <div className="aiwavo-list-right">
                    <span className="badge bg-success rounded-pill px-2 py-1">{stats?.kpi?.windowActiveChats ?? 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aiwavo-list-container">
                {automationsList.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-diagram-3 fs-3 d-block mb-1 text-secondary opacity-50"></i>
                    <span className="small">No automations configured yet</span>
                  </div>
                ) : (
                  automationsList.map((auto, idx) => (
                    <div key={`auto-${auto.id || idx}`} className="aiwavo-list-item">
                      <div className="aiwavo-list-left">
                        <div
                          className={`aiwavo-item-icon ${auto.icon === 'play' ? 'icon-play' : 'icon-pause'
                            }`}
                        >
                          <i
                            className={`bi ${auto.icon === 'play' ? 'bi-play-fill' : 'bi-pause-fill'
                              }`}
                          ></i>
                        </div>
                        <div className="aiwavo-item-info">
                          <span className="aiwavo-item-name">{auto.name}</span>
                        </div>
                      </div>
                      <div className="aiwavo-list-right">
                        <span
                          className={`aiwavo-status-pill ${auto.status === 'Running' ? 'status-running' : 'status-paused'
                            }`}
                        >
                          {auto.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Card 3: Scheduled Campaigns (or Support Shortcuts for Agent) */}
          <div className="aiwavo-section-card">
            <div className="aiwavo-section-header">
              <h3 className="aiwavo-section-title">
                <i className={`bi ${isAgent ? 'bi-lightning-charge-fill text-warning' : 'bi-calendar-event text-success'}`}></i>
                {isAgent ? 'Support Shortcuts' : 'Scheduled Campaigns'}
              </h3>
              <Link to={isAgent ? '/inbox' : '/campaigns'} className="aiwavo-section-link">
                {isAgent ? 'View Inbox' : 'View All'} <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            {isAgent ? (
              <div className="aiwavo-list-container">
                <div className="aiwavo-list-item aiwavo-clickable-item" onClick={() => navigate('/inbox')} role="button" tabIndex={0}>
                  <div className="aiwavo-list-left">
                    <div className="aiwavo-item-icon icon-send">
                      <i className="bi bi-chat-text-fill"></i>
                    </div>
                    <div className="aiwavo-item-info">
                      <span className="aiwavo-item-name">Reply to Assigned Chats</span>
                      <span className="aiwavo-item-subtext">Live conversation with assigned customers</span>
                    </div>
                  </div>
                  <div className="aiwavo-list-right">
                    <i className="bi bi-chevron-right text-muted small"></i>
                  </div>
                </div>

                <div className="aiwavo-list-item aiwavo-clickable-item" onClick={() => navigate('/contacts')} role="button" tabIndex={0}>
                  <div className="aiwavo-list-left">
                    <div className="aiwavo-item-icon icon-campaigns">
                      <i className="bi bi-person-lines-fill"></i>
                    </div>
                    <div className="aiwavo-item-info">
                      <span className="aiwavo-item-name">Manage Assigned Contacts</span>
                      <span className="aiwavo-item-subtext">Review allotted customer profiles</span>
                    </div>
                  </div>
                  <div className="aiwavo-list-right">
                    <i className="bi bi-chevron-right text-muted small"></i>
                  </div>
                </div>

                <div className="aiwavo-list-item aiwavo-clickable-item" onClick={() => navigate('/inbox')} role="button" tabIndex={0}>
                  <div className="aiwavo-list-left">
                    <div className="aiwavo-item-icon icon-whatsapp">
                      <i className="bi bi-check2-all"></i>
                    </div>
                    <div className="aiwavo-item-info">
                      <span className="aiwavo-item-name">Mark Chats Resolved</span>
                      <span className="aiwavo-item-subtext">Close inquiries once customer is satisfied</span>
                    </div>
                  </div>
                  <div className="aiwavo-list-right">
                    <i className="bi bi-chevron-right text-muted small"></i>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aiwavo-list-container">
                {scheduledCampaigns.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-calendar-x fs-3 d-block mb-1 text-secondary opacity-50"></i>
                    <span className="small">No scheduled campaigns</span>
                  </div>
                ) : (
                  scheduledCampaigns.map((camp, idx) => {
                    const iconClass =
                      camp.icon === 'gift'
                        ? 'bi-gift-fill'
                        : camp.icon === 'tag'
                          ? 'bi-tag-fill'
                          : 'bi-bell-fill';
                    return (
                      <div
                        key={`sched-${camp.id || idx}`}
                        className="aiwavo-list-item aiwavo-clickable-item"
                        onClick={() => (camp.id ? navigate(`/campaigns/${camp.id}`) : navigate('/campaigns'))}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (camp.id ? navigate(`/campaigns/${camp.id}`) : navigate('/campaigns'))}
                        title={`View ${camp.name} details`}
                      >
                        <div className="aiwavo-list-left">
                          <div className="aiwavo-item-icon icon-purple">
                            <i className={`bi ${iconClass}`}></i>
                          </div>
                          <div className="aiwavo-item-info">
                            <span className="aiwavo-item-name">{camp.name}</span>
                          </div>
                        </div>
                        <div className="aiwavo-list-right">
                          <span className="aiwavo-item-subtext text-nowrap">
                            <i className="bi bi-calendar3 me-1"></i>
                            {camp.date}
                          </span>
                          <i className="bi bi-chevron-right text-muted ms-2 small aiwavo-arrow-hover"></i>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= Row 5: 2 Bottom Cards ================= */}
        <div className="aiwavo-bottom-row">
          {/* Card 1: Recent Table (Conversations for Agent / Campaigns for Admin/Marketer) */}
          <div className="aiwavo-section-card">
            <div className="aiwavo-section-header">
              <h3 className="aiwavo-section-title">
                <i className={`bi ${isAgent ? 'bi-chat-left-dots-fill text-primary' : 'bi-megaphone-fill text-success'}`}></i>
                {isAgent ? 'My Recent Assigned Conversations' : 'Recent Campaigns'}
              </h3>
              <Link to={isAgent ? '/inbox' : '/campaigns'} className="aiwavo-section-link">
                {isAgent ? 'Open Inbox' : 'View All'} <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            <div className="table-responsive">
              {isAgent ? (
                <table className="aiwavo-campaigns-table">
                  <thead>
                    <tr>
                      <th>Customer Contact</th>
                      <th>WhatsApp Channel</th>
                      <th>Last Message</th>
                      <th>Status</th>
                      <th>24h Window</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentConversations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No assigned conversations yet. Open Inbox to start chatting.
                        </td>
                      </tr>
                    ) : (
                      recentConversations.map((c, idx) => (
                        <tr
                          key={`conv-row-${c.id || idx}`}
                          className="aiwavo-clickable-row"
                          onClick={() => navigate('/inbox')}
                          role="button"
                          tabIndex={0}
                          title={`Chat with ${c.name}`}
                        >
                          <td className="aiwavo-campaign-name-cell">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: '#eff6ff',
                                  color: '#0866FF',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  flexShrink: 0
                                }}
                              >
                                {(c.name || 'C')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark small">{c.name}</div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>{c.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="small text-muted">{c.accountName}</td>
                          <td className="small text-truncate" style={{ maxWidth: '180px' }}>
                            {c.lastMessage}
                          </td>
                          <td>
                            <span className={`aiwavo-status-pill ${c.status === 'Open' ? 'status-connected' : 'status-disconnected'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${c.isWindowOpen ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary'}`}
                              style={{ fontSize: '11px', fontWeight: '500' }}
                            >
                              <i className={`bi ${c.isWindowOpen ? 'bi-clock-fill me-1' : 'bi-lock-fill me-1'}`}></i>
                              {c.isWindowOpen ? 'Window Open' : 'Closed'}
                            </span>
                          </td>
                          <td>
                            <Link to="/inbox" className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '11px' }}>
                              Chat <i className="bi bi-arrow-right"></i>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="aiwavo-campaigns-table">
                  <thead>
                    <tr>
                      <th>Campaign Name</th>
                      <th>Status</th>
                      <th>Sent</th>
                      <th>Delivered</th>
                      <th>Delivery Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No recent campaigns found
                        </td>
                      </tr>
                    ) : (
                      recentCampaigns.map((c, idx) => {
                        const rateVal = Math.min(Number(c.deliveryRate || 0), 100);
                        const isCompleted = c.status === 'Completed';
                        return (
                          <tr
                            key={`camp-row-${c.id || idx}`}
                            className={!isAgent ? 'aiwavo-clickable-row' : ''}
                            onClick={() => (!isAgent ? (c.id ? navigate(`/campaigns/${c.id}`) : navigate('/campaigns')) : null)}
                            role={!isAgent ? 'button' : undefined}
                            tabIndex={!isAgent ? 0 : undefined}
                            style={isAgent ? { cursor: 'default' } : undefined}
                            onKeyDown={(e) => (!isAgent && (e.key === 'Enter' || e.key === ' ')) && (c.id ? navigate(`/campaigns/${c.id}`) : navigate('/campaigns'))}
                            title={!isAgent ? `View ${c.name} details` : undefined}
                          >
                            <td className="aiwavo-campaign-name-cell">
                              <div className="d-flex align-items-center justify-content-between">
                                <span className={!isAgent ? 'aiwavo-campaign-name-link' : 'fw-medium text-dark'}>{c.name}</span>
                                {!isAgent && (
                                  <i className="bi bi-box-arrow-up-right small text-muted opacity-50 ms-2 aiwavo-row-icon"></i>
                                )}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`aiwavo-status-pill ${isCompleted ? 'status-connected' : 'status-running'
                                  }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td>{c.sent.toLocaleString()}</td>
                            <td>{c.delivered.toLocaleString()}</td>
                            <td>
                              <div className="aiwavo-rate-cell">
                                <span className="aiwavo-rate-val">{rateVal}%</span>
                                <div className="aiwavo-rate-bar-bg">
                                  <div
                                    className="aiwavo-rate-bar-fill"
                                    style={{ width: `${rateVal}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Card 2: System Health */}
          <div className="aiwavo-section-card">
            <div className="aiwavo-section-header">
              <h3 className="aiwavo-section-title">
                <i className="bi bi-activity text-success"></i>
                System Health
              </h3>
              <span
                className="aiwavo-health-badge"
                style={{
                  background: systemHealth.operational ? '#ecfdf5' : '#fef2f2',
                  color: systemHealth.operational ? '#15803d' : '#dc2626'
                }}
              >
                <i className={`bi ${systemHealth.operational ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
                {systemHealth.operational ? 'All Systems Operational' : 'Degraded Performance'}
              </span>
            </div>
            <div className="aiwavo-health-grid">
              <div className="aiwavo-health-item">
                <div className="aiwavo-health-icon-wrap">
                  <i className="bi bi-whatsapp"></i>
                </div>
                <span className="aiwavo-health-name">WhatsApp</span>
                <span
                  className="aiwavo-health-status"
                  style={{
                    color: systemHealth.whatsapp === 'Connected' ? '#16a34a' : '#ea580c'
                  }}
                >
                  <span
                    className="aiwavo-legend-dot"
                    style={{
                      background: systemHealth.whatsapp === 'Connected' ? '#16a34a' : '#ea580c'
                    }}
                  ></span>
                  {systemHealth.whatsapp}
                </span>
              </div>

              <div className="aiwavo-health-item">
                <div className="aiwavo-health-icon-wrap">
                  <i className="bi bi-lightning-charge-fill"></i>
                </div>
                <span className="aiwavo-health-name">Automation Engine</span>
                <span
                  className="aiwavo-health-status"
                  style={{
                    color: systemHealth.automation === 'Running' ? '#16a34a' : '#64748b'
                  }}
                >
                  <span
                    className="aiwavo-legend-dot"
                    style={{
                      background: systemHealth.automation === 'Running' ? '#16a34a' : '#64748b'
                    }}
                  ></span>
                  {systemHealth.automation}
                </span>
              </div>

              <div className="aiwavo-health-item">
                <div className="aiwavo-health-icon-wrap">
                  <i className="bi bi-hdd-stack-fill"></i>
                </div>
                <span className="aiwavo-health-name">System Status</span>
                <span
                  className="aiwavo-health-status"
                  style={{
                    color: systemHealth.system === 'All Good' ? '#16a34a' : '#dc2626'
                  }}
                >
                  <span
                    className="aiwavo-legend-dot"
                    style={{
                      background: systemHealth.system === 'All Good' ? '#16a34a' : '#dc2626'
                    }}
                  ></span>
                  {systemHealth.system}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
