-- Migration 013: Keyword Auto-Replies & Razorpay Payments Tables

CREATE TABLE IF NOT EXISTS keyword_auto_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  match_type ENUM('exact', 'contains', 'starts_with') NOT NULL DEFAULT 'contains',
  reply_text TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  trigger_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_auto_replies_business (business_id),
  INDEX idx_auto_replies_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_orders (
  id VARCHAR(64) PRIMARY KEY,
  business_id INT NOT NULL,
  user_id INT,
  plan_id INT NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  receipt VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_orders_biz (business_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(64) PRIMARY KEY,
  business_id INT NOT NULL,
  user_id INT,
  plan_id INT NOT NULL,
  order_id VARCHAR(64),
  payment_id VARCHAR(64) NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL DEFAULT 'captured',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transactions_biz (business_id),
  INDEX idx_transactions_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
