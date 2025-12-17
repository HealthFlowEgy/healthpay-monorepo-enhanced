-- Migration: Add Security Columns
-- Version: 001
-- Description: Add encrypted columns alongside existing ones for backward compatibility
-- Author: Healthpay Migration
-- Date: 2025-12-17

-- ============================================
-- USERS TABLE ENHANCEMENTS
-- ============================================

-- Add encrypted columns (keep original columns for backward compatibility)
ALTER TABLE User ADD COLUMN IF NOT EXISTS mobile_encrypted VARCHAR(500);
ALTER TABLE User ADD COLUMN IF NOT EXISTS nationalId_encrypted VARCHAR(500);

-- Add MFA columns
ALTER TABLE User ADD COLUMN IF NOT EXISTS mfa_secret_encrypted VARCHAR(500);
ALTER TABLE User ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE User ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;

-- Add security tracking columns
ALTER TABLE User ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE User ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
ALTER TABLE User ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;
ALTER TABLE User ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP NULL;

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_body JSON,
  response_status INT,
  metadata JSON,
  hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_timestamp (timestamp),
  INDEX idx_audit_action (action),
  INDEX idx_audit_resource (resource_type, resource_id)
);

-- ============================================
-- FEATURE FLAGS TABLE (Optional - for DB-driven flags)
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT FALSE,
  percentage INT DEFAULT 100,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_feature_name (name)
);

-- Insert default feature flags
INSERT IGNORE INTO feature_flags (name, enabled, percentage, description) VALUES
  ('ENCRYPTION_ENABLED', FALSE, 100, 'Enable field-level encryption'),
  ('MFA_ENABLED', FALSE, 100, 'Enable multi-factor authentication'),
  ('AUDIT_LOGGING_ENABLED', TRUE, 100, 'Enable audit logging'),
  ('RATE_LIMITING_ENABLED', TRUE, 100, 'Enable API rate limiting'),
  ('WALLET_SUBSCRIPTION', FALSE, 100, 'Enable wallet subscription feature'),
  ('EARLY_PAYMENT', FALSE, 100, 'Enable early payment feature'),
  ('AUCTION_SYSTEM', FALSE, 100, 'Enable auction system'),
  ('MAINTENANCE_MODE', FALSE, 100, 'Enable maintenance mode');

-- ============================================
-- API KEYS TABLE (for secure key management)
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  merchant_id INT,
  permissions JSON,
  rate_limit INT DEFAULT 100,
  expires_at TIMESTAMP NULL,
  last_used_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_api_key_hash (key_hash),
  INDEX idx_api_key_merchant (merchant_id),
  FOREIGN KEY (merchant_id) REFERENCES Merchant(id) ON DELETE CASCADE
);

-- ============================================
-- SESSION TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(64),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_session_user (user_id),
  INDEX idx_session_active (is_active, expires_at),
  FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);
