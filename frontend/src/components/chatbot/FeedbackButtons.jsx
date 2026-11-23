import React, { useState } from 'react';

export default function FeedbackButtons({ messageId, conversationId, onFeedback }) {
  const [feedbackGiven, setFeedbackGiven] = useState(null); // 'helpful' | 'unhelpful' | null

  const handleVote = (type) => {
    if (feedbackGiven) return;
    setFeedbackGiven(type);
    if (onFeedback) {
      onFeedback({ messageId, conversationId, feedbackType: type });
    }
  };

  return (
    <div className="ai-feedback-row d-flex align-items-center gap-2 mt-2 pt-1">
      <span className="small text-muted" style={{ fontSize: '0.68rem' }}>Was this answer helpful?</span>
      <button
        type="button"
        className={`btn btn-sm ai-vote-btn ${feedbackGiven === 'helpful' ? 'btn-success text-white active' : 'btn-outline-secondary'}`}
        onClick={() => handleVote('helpful')}
        disabled={Boolean(feedbackGiven)}
        title="Helpful"
      >
        <i className="bi bi-hand-thumbs-up"></i>
      </button>
      <button
        type="button"
        className={`btn btn-sm ai-vote-btn ${feedbackGiven === 'unhelpful' ? 'btn-danger text-white active' : 'btn-outline-secondary'}`}
        onClick={() => handleVote('unhelpful')}
        disabled={Boolean(feedbackGiven)}
        title="Not Helpful"
      >
        <i className="bi bi-hand-thumbs-down"></i>
      </button>

      {feedbackGiven && (
        <span className="small text-success fw-semibold ms-1" style={{ fontSize: '0.68rem' }}>
          Thank you for your feedback!
        </span>
      )}
    </div>
  );
}
