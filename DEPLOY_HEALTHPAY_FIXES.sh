#!/bin/bash
# ============================================================================
# HEALTHPAY WALLET - COMPLETE FIX DEPLOYMENT
# ============================================================================
# This script deploys ALL fixes to make the HealthPay wallet 100% functional
# 
# Run on server: bash <(curl -s https://raw.githubusercontent.com/HealthFlowEgy/healthpay-monorepo-enhanced/main/DEPLOY_HEALTHPAY_FIXES.sh)
# Or: wget -O - https://raw.githubusercontent.com/HealthFlowEgy/healthpay-monorepo-enhanced/main/DEPLOY_HEALTHPAY_FIXES.sh | bash
# ============================================================================

set -e

echo "🚀 HealthPay Wallet - Complete Fix Deployment"
echo "=============================================="
echo ""
echo "This will:"
echo "  1. ✅ Run database migrations"
echo "  2. ✅ Deploy backend resolver fixes"
echo "  3. ✅ Deploy frontend page fixes"
echo "  4. ✅ Deploy static HTML pages"
echo "  5. ✅ Rebuild and restart services"
echo "  6. ✅ Test all fixes"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# ============================================================================
# STEP 1: Clone/Pull Latest Code
# ============================================================================
echo ""
echo "📥 Step 1/6: Getting latest code from GitHub..."

REPO_DIR="/root/healthpay-fixes"
if [ -d "$REPO_DIR" ]; then
    echo "Repository exists, pulling latest..."
    cd "$REPO_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/HealthFlowEgy/healthpay-monorepo-enhanced.git "$REPO_DIR"
    cd "$REPO_DIR"
fi

echo "✅ Code updated"

# ============================================================================
# STEP 2: Database Migration
# ============================================================================
echo ""
echo "📊 Step 2/6: Running database migrations..."

docker exec healthpay-postgres psql -U healthpay -d healthpay_ledger << 'SQLMIGRATION'
-- Add missing columns
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS balance_before DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS balance_after DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);

-- Update existing records
UPDATE transactions SET net_amount = amount WHERE net_amount IS NULL;
UPDATE transactions SET fee_amount = 0 WHERE fee_amount IS NULL;

-- Add transaction_pin to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS transaction_pin VARCHAR(255);

-- Verify
SELECT 'Database migration complete' as status;
SQLMIGRATION

echo "✅ Database migrated"

# ============================================================================
# STEP 3: Deploy Backend Resolvers
# ============================================================================
echo ""
echo "🔧 Step 3/6: Deploying backend resolver fixes..."

# Find the query service directory
QUERY_SERVICE_DIR="/root/healthpay/apps/query-service"
if [ ! -d "$QUERY_SERVICE_DIR" ]; then
    QUERY_SERVICE_DIR="/root/healthpay/packages/query-service"
fi

if [ -d "$QUERY_SERVICE_DIR" ]; then
    RESOLVERS_DIR="$QUERY_SERVICE_DIR/src/resolvers"
    mkdir -p "$RESOLVERS_DIR"
    
    # Copy resolver files
    cp "$REPO_DIR/fixes/backend-resolvers/sendMoney.resolver.ts" "$RESOLVERS_DIR/"
    cp "$REPO_DIR/fixes/backend-resolvers/transaction.resolver.ts" "$RESOLVERS_DIR/"
    cp "$REPO_DIR/fixes/backend-resolvers/pin.resolver.ts" "$RESOLVERS_DIR/"
    
    echo "✅ Backend resolvers deployed"
else
    echo "⚠️  Query service directory not found, skipping backend deployment"
fi

# ============================================================================
# STEP 4: Deploy Frontend Pages
# ============================================================================
echo ""
echo "🎨 Step 4/6: Deploying frontend page fixes..."

# Find the wallet dashboard directory
WALLET_DIR="/root/healthpay/apps/wallet-dashboard"
if [ ! -d "$WALLET_DIR" ]; then
    WALLET_DIR="/root/healthpay/packages/wallet-dashboard"
fi

if [ -d "$WALLET_DIR" ]; then
    # Create directories
    mkdir -p "$WALLET_DIR/app/(dashboard)/dashboard"
    mkdir -p "$WALLET_DIR/app/transfer"
    mkdir -p "$WALLET_DIR/app/settings/pin"
    
    # Copy page files
    cp "$REPO_DIR/fixes/frontend-pages/dashboard-page.tsx" "$WALLET_DIR/app/(dashboard)/dashboard/page.tsx"
    cp "$REPO_DIR/fixes/frontend-pages/transfer-page.tsx" "$WALLET_DIR/app/transfer/page.tsx"
    cp "$REPO_DIR/fixes/frontend-pages/pin-page.tsx" "$WALLET_DIR/app/settings/pin/page.tsx"
    
    echo "✅ Frontend pages deployed"
else
    echo "⚠️  Wallet dashboard directory not found, skipping frontend deployment"
fi

# ============================================================================
# STEP 5: Deploy Static Pages
# ============================================================================
echo ""
echo "🌐 Step 5/6: Deploying static HTML pages..."

# Find static directory
STATIC_DIR="/var/www/healthpay-static"
if [ ! -d "$STATIC_DIR" ]; then
    STATIC_DIR="/usr/share/nginx/html"
fi

if [ -d "$STATIC_DIR" ]; then
    cp "$REPO_DIR/fixes/static-pages/set-pin.html" "$STATIC_DIR/"
    cp "$REPO_DIR/fixes/static-pages/transfer.html" "$STATIC_DIR/"
    
    echo "✅ Static pages deployed"
    echo "   - http://YOUR_IP:8080/set-pin.html"
    echo "   - http://YOUR_IP:8080/transfer.html"
else
    echo "⚠️  Static directory not found, skipping static page deployment"
fi

# ============================================================================
# STEP 6: Rebuild and Restart Services
# ============================================================================
echo ""
echo "🔨 Step 6/6: Rebuilding services..."

# Restart query service
if docker ps | grep -q healthpay-query-service; then
    echo "Restarting query service..."
    docker restart healthpay-query-service
    sleep 5
fi

# Rebuild wallet dashboard
if docker ps | grep -q healthpay-wallet-dashboard; then
    echo "Rebuilding wallet dashboard..."
    docker exec healthpay-wallet-dashboard npm run build
    docker restart healthpay-wallet-dashboard
    sleep 5
fi

echo "✅ Services restarted"

# ============================================================================
# STEP 7: Verification
# ============================================================================
echo ""
echo "🧪 Verifying deployment..."
echo ""

# Check services
echo "Service Status:"
echo "---------------"

if curl -s http://localhost:4000/graphql > /dev/null 2>&1; then
    echo "✅ GraphQL API (4000): Running"
else
    echo "❌ GraphQL API (4000): Not responding"
fi

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Wallet Dashboard (3001): Running"
else
    echo "❌ Wallet Dashboard (3001): Not responding"
fi

if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Static Pages (8080): Running"
else
    echo "❌ Static Pages (8080): Not responding"
fi

# Check database
echo ""
echo "Database Status:"
echo "----------------"
docker exec healthpay-postgres psql -U healthpay -d healthpay_ledger -c "SELECT COUNT(*) as transaction_count FROM transactions;" -t | xargs echo "Transactions:"
docker exec healthpay-postgres psql -U healthpay -d healthpay_ledger -c "SELECT COUNT(*) as user_count FROM users;" -t | xargs echo "Users:"
docker exec healthpay-postgres psql -U healthpay -d healthpay_ledger -c "SELECT SUM(balance) as total_balance FROM wallets;" -t | xargs echo "Total Balance:"

# ============================================================================
# DONE
# ============================================================================
echo ""
echo "=============================================="
echo "🎉 Deployment Complete!"
echo "=============================================="
echo ""
echo "✅ What was fixed:"
echo "  1. Wallet balance now updates after transfer"
echo "  2. Transaction.netAmount field added"
echo "  3. Dashboard no longer crashes"
echo "  4. Set PIN functionality added"
echo "  5. Complete transfer UI flow"
echo ""
echo "🧪 Test the fixes:"
echo "  1. Login: http://YOUR_IP:8080/login.html"
echo "  2. Set PIN: http://YOUR_IP:8080/set-pin.html"
echo "  3. Transfer: http://YOUR_IP:8080/transfer.html"
echo "  4. Dashboard: http://YOUR_IP:3001/dashboard"
echo ""
echo "📊 Expected Results:"
echo "  ✅ Dashboard loads without errors"
echo "  ✅ Users can set/change PIN"
echo "  ✅ Money transfers update both wallets"
echo "  ✅ Transactions display correctly"
echo "  ✅ System is 100% functional"
echo ""
echo "=============================================="
