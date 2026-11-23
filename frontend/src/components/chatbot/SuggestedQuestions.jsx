import React from 'react';

const SUGGESTIONS = [
  'How can I connect my WhatsApp number?',
  'How does broadcasting work?',
  'How can I create a WhatsApp template?',
  'How can I create a campaign?',
  'How does chatbot automation work?',
  'How can I check message delivery reports?'
];

export default function SuggestedQuestions({ onSelectQuestion, disabled = false }) {
  return (
    <div className="ai-suggestions-container p-3 pt-1">
      <div className="small text-muted fw-semibold mb-2" style={{ fontSize: '0.75rem' }}>
        <i className="bi bi-lightbulb-fill text-warning me-1"></i> Frequently Asked Questions:
      </div>
      <div className="d-flex flex-wrap gap-1">
        {SUGGESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-sm ai-suggestion-chip"
            onClick={() => onSelectQuestion(q)}
            disabled={disabled}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
