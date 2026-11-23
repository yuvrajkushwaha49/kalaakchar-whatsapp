import React, { useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import SourceReferences from './SourceReferences.jsx';
import FeedbackButtons from './FeedbackButtons.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import SuggestedQuestions from './SuggestedQuestions.jsx';

const WELCOME_TEXT = `नमस्ते! 🙏 I am your **WhatsApp SaaS AI Support Assistant**.

Main aapki WhatsApp Marketing & Automation Platform se judi queries mein madad kar sakta hoon.

Aap mujhse platform ke kisi bhi feature ke baare mein pooch sakte hain, jaise:
- WhatsApp Cloud API & Embedded Signup
- Templates & Meta approvals
- Broadcasting, Campaigns & Scheduling
- Contacts & CSV Imports
- Team Inbox & Auto-Replies
- Billing & Razorpay Payments`;

export default function ChatMessages({
  messages = [],
  loading = false,
  error = null,
  onFeedback,
  onSelectSuggestion,
  onRetry
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, error]);

  return (
    <div className="ai-chat-messages-body p-3 flex-grow-1 overflow-auto">
      {/* 1. Official Initial Welcome Message */}
      <div className="d-flex align-items-start gap-2 mb-3 ai-msg-row ai-msg-assistant">
        <div className="ai-avatar-tiny flex-shrink-0">
          <i className="bi bi-robot text-white"></i>
        </div>
        <div className="ai-bubble ai-bubble-assistant shadow-sm">
          <MarkdownRenderer content={WELCOME_TEXT} />
        </div>
      </div>

      {/* 2. Show Suggested Questions when user has not asked anything yet */}
      {messages.length === 0 && (
        <SuggestedQuestions onSelectQuestion={onSelectSuggestion} disabled={loading} />
      )}

      {/* 3. Render Message History */}
      {messages.map((m, idx) => {
        const isUser = m.role === 'user' || m.sender_type === 'user';
        return (
          <div
            key={m.id || idx}
            className={`d-flex align-items-start gap-2 mb-3 ai-msg-row ${isUser ? 'justify-content-end ai-msg-user' : 'ai-msg-assistant'}`}
          >
            {!isUser && (
              <div className="ai-avatar-tiny flex-shrink-0">
                <i className="bi bi-robot text-white"></i>
              </div>
            )}
            <div className={`ai-bubble ${isUser ? 'ai-bubble-user text-white' : 'ai-bubble-assistant shadow-sm'}`}>
              <MarkdownRenderer content={m.content || m.message_content} />

              {!isUser && m.sources && m.sources.length > 0 && (
                <SourceReferences sources={m.sources} />
              )}

              {!isUser && (m.id || m.conversation_id) && (
                <FeedbackButtons
                  messageId={m.id}
                  conversationId={m.conversation_id}
                  onFeedback={onFeedback}
                />
              )}
            </div>
            {isUser && (
              <div className="ai-avatar-tiny-user flex-shrink-0">
                <i className="bi bi-person-fill text-white"></i>
              </div>
            )}
          </div>
        );
      })}

      {/* 4. Typing Indicator */}
      {loading && <TypingIndicator />}

      {/* 5. Error Banner with Retry */}
      {error && (
        <div className="alert alert-danger py-2 px-3 small d-flex align-items-center justify-content-between mb-2">
          <span><i className="bi bi-exclamation-triangle-fill me-1"></i> {error}</span>
          {onRetry && (
            <button type="button" className="btn btn-sm btn-outline-danger py-0 px-2 ms-2" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
