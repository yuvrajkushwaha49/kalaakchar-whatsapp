-- Migration 014: AI Support Chatbot & Knowledge Base System

-- 1. AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  conversation_title VARCHAR(255) NOT NULL DEFAULT 'New Support Chat',
  status ENUM('active', 'archived', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ai_conv_tenant (tenant_id),
  INDEX idx_ai_conv_user (user_id),
  INDEX idx_ai_conv_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_type ENUM('user', 'assistant', 'system') NOT NULL,
  message_content TEXT NOT NULL,
  message_status ENUM('sent', 'failed', 'blocked') DEFAULT 'sent',
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  model_name VARCHAR(100),
  sources JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_msg_conv (conversation_id),
  INDEX idx_ai_msg_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. AI Knowledge Documents
CREATE TABLE IF NOT EXISTS ai_knowledge_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_name VARCHAR(255) NOT NULL,
  document_path VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  version VARCHAR(50) DEFAULT '1.0',
  status VARCHAR(50) DEFAULT 'indexed',
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ai_doc_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. AI Knowledge Chunks
CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  chunk_content TEXT NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  search_metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_chunk_doc (document_id),
  FULLTEXT INDEX ft_chunk_content (chunk_content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. AI Feedback
CREATE TABLE IF NOT EXISTS ai_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  tenant_id INT NOT NULL,
  feedback_type ENUM('helpful', 'unhelpful') NOT NULL,
  feedback_comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_fb_msg (message_id),
  INDEX idx_ai_fb_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. AI Settings (Super Admin configuration)
CREATE TABLE IF NOT EXISTS ai_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AI Usage Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  user_id INT NOT NULL,
  conversation_id INT,
  model_name VARCHAR(100),
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  request_status ENUM('success', 'failed', 'blocked') DEFAULT 'success',
  error_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_usage_tenant (tenant_id),
  INDEX idx_ai_usage_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Settings Seed
INSERT INTO ai_settings (setting_key, setting_value)
VALUES 
  ('ai_chat_enabled', 'true'),
  ('gemini_model', 'gemini-1.5-flash'),
  ('gemini_temperature', '0.3'),
  ('max_output_tokens', '1000'),
  ('request_timeout_ms', '30000'),
  ('input_cost_per_million', '0.075'),
  ('output_cost_per_million', '0.30')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
