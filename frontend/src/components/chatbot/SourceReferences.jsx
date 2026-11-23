import React from 'react';

export default function SourceReferences({ sources = [] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="ai-sources-wrapper mt-2 pt-2 border-top border-light">
      <div className="small text-muted d-flex align-items-center gap-1 mb-1" style={{ fontSize: '0.7rem' }}>
        <i className="bi bi-journal-bookmark-fill text-primary"></i>
        <span>Documented Sources:</span>
      </div>
      <div className="d-flex flex-wrap gap-1">
        {sources.map((s, idx) => (
          <span key={idx} className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.68rem', fontWeight: 500 }}>
            {s.title || s.path}
          </span>
        ))}
      </div>
    </div>
  );
}
