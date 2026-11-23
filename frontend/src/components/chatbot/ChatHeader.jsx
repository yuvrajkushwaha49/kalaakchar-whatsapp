import React from 'react';

export default function ChatHeader({ onNewChat, onClose, isOnline = true }) {
  return (
    <div className="ai-chat-header d-flex align-items-center justify-content-between p-3 border-bottom">
      <div className="d-flex align-items-center gap-2">
        <div className="ai-avatar-wrapper position-relative">
          <div className="ai-avatar-circle">
            <i className="bi bi-robot text-white fs-5"></i>
          </div>
          {isOnline && <span className="ai-status-indicator" title="Service Online"></span>}
        </div>
        <div>
          <h6 className="mb-0 fw-bold text-dark ai-title">WhatsApp SaaS AI Assistant</h6>
          <span className="small text-muted d-block" style={{ fontSize: '0.72rem' }}>
            Your dedicated platform support assistant
          </span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-1">
        <button
          type="button"
          className="btn btn-sm btn-light border-0 rounded-circle ai-icon-btn"
          title="Start Fresh Conversation"
          onClick={onNewChat}
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-light border-0 rounded-circle ai-icon-btn"
          title="Minimize Chat"
          onClick={onClose}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  );
}
