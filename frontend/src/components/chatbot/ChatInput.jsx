import React, { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (disabled || !input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  return (
    <form className="ai-chat-input-container p-2 border-top bg-white d-flex align-items-end gap-2" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        rows={1}
        className="form-control ai-textarea border-0 shadow-none"
        placeholder="Type your WhatsApp platform question... (Enter to send)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        type="submit"
        className="btn btn-aiveexa-primary rounded-circle ai-send-btn d-flex align-items-center justify-content-center"
        disabled={disabled || !input.trim()}
        title="Send Message"
      >
        <i className="bi bi-send-fill" style={{ fontSize: '0.85rem' }}></i>
      </button>
    </form>
  );
}
