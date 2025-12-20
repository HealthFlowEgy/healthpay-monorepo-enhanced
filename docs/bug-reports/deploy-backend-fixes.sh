#!/bin/bash
# =============================================================================
# HEALTHPAY - Backend Bug Fix Deployment Script
# 
# This script fixes:
# 1. P0 CRITICAL: sendMoney not updating wallet balances
# 2. P1 HIGH: setTransactionPIN mutation failing
# 3. P2 MEDIUM: User status 'pending' preventing transfers
#
# Run on server: bash deploy-backend-fixes.sh
# =============================================================================

set -e

echo "============================================"
echo "🔧 HealthPay Backend Bug Fixes"
echo "============================================"
echo ""

SERVER_IP="104.248.245.150"
PROJECT_DIR="/opt/healthpay/HealthPay-wallet-Re-engineered"

# =============================================================================
# STEP 1: Database Migration
# =============================================================================
echo "📊 Step 1: Running database migration..."

# Run migration via docker
docker exec -i healthpay-postgres psql -U healthpay -d healthpay_ledger << 'MIGRATION'

-- Add transaction_pin to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS transaction_pin VARCHAR(255);

-- Add missing columns to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_wallet_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_wallet_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_balance_before DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_balance_after DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_balance_before DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_balance_after DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add available_balance to wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS available_balance DECIMAL(15,2);

-- Update NULL values
UPDATE transactions SET net_amount = amount WHERE net_amount IS NULL;
UPDATE transactions SET fee = 0 WHERE fee IS NULL;
UPDATE wallets SET available_balance = balance WHERE available_balance IS NULL;

-- Auto-activate pending users (UNCOMMENT IF NEEDED)
-- UPDATE users SET status = 'active' WHERE status = 'pending';

SELECT 'Migration completed successfully' as status;

MIGRATION

echo "✅ Database migration complete"

# =============================================================================
# STEP 2: Verify Current State
# =============================================================================
echo ""
echo "🔍 Step 2: Verifying current state..."

# Check columns exist
docker exec healthpay-postgres psql -U healthpay -d healthpay_ledger -c "
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='transaction_pin') 
       THEN '✅ users.transaction_pin exists' 
       ELSE '❌ users.transaction_pin MISSING' 
  END as users_check,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='sender_wallet_id') 
       THEN '✅ transactions.sender_wallet_id exists' 
       ELSE '❌ transactions.sender_wallet_id MISSING' 
  END as transactions_check,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wallets' AND column_name='available_balance') 
       THEN '✅ wallets.available_balance exists' 
       ELSE '❌ wallets.available_balance MISSING' 
  END as wallets_check;
"

# =============================================================================
# STEP 3: Instructions for Code Changes
# =============================================================================
echo ""
echo "============================================"
echo "📝 MANUAL STEPS REQUIRED"
echo "============================================"
echo ""
echo "The database migration is complete!"
echo ""
echo "Now you need to update the resolver code:"
echo ""
echo "1. Copy the fixed sendMoney resolver:"
echo "   - From: sendMoney.resolver.ts"
echo "   - To:   $PROJECT_DIR/packages/query-service/src/resolvers/"
echo ""
echo "2. Copy the fixed PIN resolver:"
echo "   - From: pin.resolver.ts"
echo "   - To:   $PROJECT_DIR/packages/query-service/src/resolvers/"
echo ""
echo "3. Update your main resolvers.ts to import these:"
echo "   import { sendMoney } from './sendMoney.resolver';"
echo "   import { setTransactionPIN, changeTransactionPIN, hasPinSet } from './pin.resolver';"
echo ""
echo "4. Add schema additions to schema.graphql"
echo ""
echo "5. Rebuild the container:"
echo "   cd $PROJECT_DIR"
echo "   docker-compose down healthpay-query-service"
echo "   docker-compose build healthpay-query-service --no-cache"
echo "   docker-compose up -d healthpay-query-service"
echo ""
echo "============================================"

# =============================================================================
# STEP 4: Test the Fixes
# =============================================================================
echo ""
echo "🧪 Step 4: Test commands (run after code update)..."
echo ""
echo "# Test setTransactionPIN:"
echo 'curl -X POST http://104.248.245.150:4000/graphql \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -d '"'"'{"query":"mutation { setTransactionPIN(input: {pin: \"1234\", confirmPin: \"1234\"}) { success message } }"}'"'"
echo ""
echo "# Test sendMoney:"
echo 'curl -X POST http://104.248.245.150:4000/graphql \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN" \'
echo '  -d '"'"'{"query":"mutation { sendMoney(input: {recipientPhone: \"01016464676\", amount: 10, pin: \"1234\"}) { success message newBalance } }"}'"'"
echo ""

# =============================================================================
# DONE
# =============================================================================
echo "============================================"
echo "✅ Database preparation complete!"
echo "============================================"
echo ""
echo "Summary:"
echo "  ✅ Database columns added"
echo "  ⚠️  Resolver code needs manual update"
echo "  ⚠️  Docker container needs rebuild"
echo ""
echo "After updating code and rebuilding, test with:"
echo "  1. Set PIN for a user"
echo "  2. Send money between users"
echo "  3. Verify wallet balances actually update"
echo ""
echo "============================================"
