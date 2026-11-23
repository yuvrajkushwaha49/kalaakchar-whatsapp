import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader.jsx';
import ChatMessages from './ChatMessages.jsx';
import ChatInput from './ChatInput.jsx';
import api from '../../services/api';
import './AIChatWidget.css';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState('');

  // Fetch or restore latest active conversation on open
  useEffect(() => {
    if (isOpen && !conversationId && messages.length === 0) {
      loadLatestConversation();
    }
  }, [isOpen]);

  const loadLatestConversation = async () => {
    try {
      const res = await api.get('/ai/conversations');
      const list = res.data?.data || [];
      if (list.length > 0) {
        const latest = list[0];
        setConversationId(latest.id);
        const msgRes = await api.get(`/ai/conversations/${latest.id}`);
        setMessages(msgRes.data?.data || []);
      }
    } catch (_) {
      // Quiet fail if guest or network is loading
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setError(null);
    setLastUserMessage(text);

    // Optimistic user message append
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        conversationId,
        message: text
      });

      if (res.data?.success) {
        if (!conversationId && res.data.conversationId) {
          setConversationId(res.data.conversationId);
        }
        setMessages(prev => [
          ...prev,
          {
            id: res.data.message.id,
            conversation_id: res.data.conversationId,
            role: 'assistant',
            content: res.data.message.content,
            sources: res.data.sources || [],
            created_at: new Date()
          }
        ]);
      } else if (res.data?.error) {
        setError(res.data.error.message || 'Could not process request');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to send message. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleFeedback = async ({ messageId, conversationId: cId, feedbackType }) => {
    try {
      await api.post('/ai/feedback', {
        messageId,
        conversationId: cId || conversationId,
        feedbackType
      });
    } catch (_) {
      // Ignored for non-critical feedback
    }
  };

  const handleRetry = () => {
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage);
    }
  };

  return (
    <div className="ai-chat-root">
      {/* 1. Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          className="ai-chat-launcher shadow-lg"
          onClick={() => setIsOpen(true)}
          title="Open WhatsApp SaaS AI Support"
          aria-label="Open AI Support Chat"
        >
          <div className="ai-launcher-icon-wrapper">
            <i className="bi bi-robot ai-robot-icon"></i>
            <span className="ai-launcher-badge">AI</span>
          </div>
        </button>
      )}

      {/* 2. Chat Window Popup */}
      {isOpen && (
        <div className="ai-chat-window shadow-lg d-flex flex-column animate-popup">
          <ChatHeader
            onNewChat={handleNewChat}
            onClose={() => setIsOpen(false)}
            isOnline={true}
          />
          <ChatMessages
            messages={messages}
            loading={loading}
            error={error}
            onFeedback={handleFeedback}
            onSelectSuggestion={handleSendMessage}
            onRetry={handleRetry}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}
