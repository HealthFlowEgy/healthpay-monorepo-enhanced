-- =============================================================================
-- HEALTHPAY - Database Migration
-- 
-- This migration adds missing columns needed for the sendMoney and PIN fixes
-- Run this on your PostgreSQL database
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add transaction_pin column to users table
-- -----------------------------------------------------------------------------
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS transaction_pin VARCHAR(255);

-- -----------------------------------------------------------------------------
-- 2. Add missing columns to transactions table
-- -----------------------------------------------------------------------------

-- Wallet IDs
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS sender_wallet_id UUID REFERENCES wallets(id);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recipient_wallet_id UUID REFERENCES wallets(id);

-- Balance snapshots
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS sender_balance_before DECIMAL(15,2);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS sender_balance_after DECIMAL(15,2);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recipient_balance_before DECIMAL(15,2);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recipient_balance_after DECIMAL(15,2);

-- Contact info
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(20);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);

-- Fee tracking
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15,2);

-- Metadata
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Timestamps
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- -----------------------------------------------------------------------------
-- 3. Update existing transactions to have net_amount
-- -----------------------------------------------------------------------------
UPDATE transactions 
SET net_amount = amount 
WHERE net_amount IS NULL;

UPDATE transactions 
SET fee = 0 
WHERE fee IS NULL;

-- -----------------------------------------------------------------------------
-- 4. Ensure wallets table has available_balance
-- -----------------------------------------------------------------------------
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS available_balance DECIMAL(15,2);

-- Update available_balance to match balance where NULL
UPDATE wallets 
SET available_balance = balance 
WHERE available_balance IS NULL;

-- -----------------------------------------------------------------------------
-- 5. Create index for better query performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_sender_wallet 
ON transactions(sender_wallet_id);

CREATE INDEX IF NOT EXISTS idx_transactions_recipient_wallet 
ON transactions(recipient_wallet_id);

CREATE INDEX IF NOT EXISTS idx_transactions_reference 
ON transactions(reference);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_transaction_pin 
ON users(id) WHERE transaction_pin IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. Fix user status for existing users (optional)
-- -----------------------------------------------------------------------------
-- Uncomment the following line to auto-activate all pending users:
-- UPDATE users SET status = 'active' WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- Verification queries (run these to confirm migration)
-- -----------------------------------------------------------------------------

-- Check users table structure
-- \d users

-- Check transactions table structure
-- \d transactions

-- Check wallets table structure
-- \d wallets

-- =============================================================================
-- DONE! Run the verification queries above to confirm all columns exist.
-- =============================================================================
