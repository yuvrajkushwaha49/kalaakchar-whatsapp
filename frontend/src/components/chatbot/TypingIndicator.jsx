import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="d-flex align-items-center gap-2 p-2 my-2 ms-2 ai-typing-wrapper">
      <div className="ai-avatar-tiny">
        <i className="bi bi-robot text-white" style={{ fontSize: '0.75rem' }}></i>
      </div>
      <div className="ai-typing-bubble">
        <span className="ai-dot"></span>
        <span className="ai-dot"></span>
        <span className="ai-dot"></span>
      </div>
    </div>
  );
}
