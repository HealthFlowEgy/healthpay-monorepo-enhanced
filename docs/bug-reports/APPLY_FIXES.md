# How to Apply HealthPay Backend Fixes

## 🎯 Quick Start

This directory contains complete fixes for all three critical bugs found in the HealthPay backend on December 20, 2025.

---

## 📦 What's Included

| File | Purpose |
|------|---------|
| **sendMoney.resolver.ts** | Fixed sendMoney mutation that properly updates wallet balances |
| **pin.resolver.ts** | Fixed setTransactionPIN with correct schema naming |
| **schema-additions.graphql** | GraphQL schema updates to merge into your schema |
| **migration.sql** | Database migration to add missing columns |
| **deploy-backend-fixes.sh** | Automated deployment script |
| **healthpay-complete-fix.sh** | Complete fix script (migration + code deployment) |

---

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)

Run the complete fix script that handles everything:

```bash
# Download the script
curl -o healthpay-complete-fix.sh https://raw.githubusercontent.com/HealthFlowEgy/healthpay-monorepo-enhanced/main/docs/bug-reports/healthpay-complete-fix.sh

# Make it executable
chmod +x healthpay-complete-fix.sh

# Run it
./healthpay-complete-fix.sh
```

This script will:
1. ✅ Run database migration
2. ✅ Backup existing resolvers
3. ✅ Copy new resolver files
4. ✅ Update schema
5. ✅ Rebuild Docker container
6. ✅ Run verification tests

---

### Option 2: Manual Step-by-Step

#### Step 1: Database Migration

```bash
ssh root@104.248.245.150

# Copy migration.sql to server, then:
docker exec -i healthpay-postgres psql -U healthpay -d healthpay_ledger < migration.sql
```

Or run directly:

```bash
docker exec -i healthpay-postgres psql -U healthpay -d healthpay_ledger << 'EOF'
-- Add missing columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_wallet_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_wallet_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_balance_before DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sender_balance_after DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_balance_before DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_balance_after DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fee DECIMAL(15,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add available_balance to wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS available_balance DECIMAL(15,2);
UPDATE wallets SET available_balance = balance WHERE available_balance IS NULL;

-- Set net_amount for existing transactions
UPDATE transactions SET net_amount = amount WHERE net_amount IS NULL;
EOF
```

#### Step 2: Update Resolver Code

Find your backend code directory (likely `/opt/healthpay/HealthPay-wallet-Re-engineered` or similar):

```bash
cd /opt/healthpay/HealthPay-wallet-Re-engineered

# Backup existing files
cp src/resolvers.ts src/resolvers.ts.backup
cp src/schema.graphql src/schema.graphql.backup

# Copy new resolver files
# (Download from GitHub first)
cp sendMoney.resolver.ts src/resolvers/
cp pin.resolver.ts src/resolvers/
```

#### Step 3: Update Main Resolver Index

Edit your main `src/resolvers.ts` or `src/index.ts`:

```typescript
import { sendMoney } from './resolvers/sendMoney.resolver';
import { 
  setTransactionPIN, 
  changeTransactionPIN, 
  verifyTransactionPIN,
  hasPinSet 
} from './resolvers/pin.resolver';

export const resolvers = {
  Query: {
    // ... existing queries
    hasPinSet,
  },
  Mutation: {
    // ... existing mutations
    sendMoney,
    setTransactionPIN,
    changeTransactionPIN,
    verifyTransactionPIN,
  },
};
```

#### Step 4: Update GraphQL Schema

Merge `schema-additions.graphql` into your `schema.graphql`:

```graphql
# Add these types
input SetTransactionPINInput {
  pin: String!
  confirmPin: String!
}

input ChangeTransactionPINInput {
  currentPin: String!
  newPin: String!
  confirmNewPin: String!
}

input SendMoneyInput {
  recipientPhone: String!
  amount: Float!
  pin: String!
  note: String
  saveRecipient: Boolean
}

type SendMoneyResult {
  success: Boolean!
  message: String!
  transactionId: String
  newBalance: Float
}

# Update Mutation type
type Mutation {
  # ... existing mutations
  setTransactionPIN(input: SetTransactionPINInput!): OperationResult!
  changeTransactionPIN(input: ChangeTransactionPINInput!): OperationResult!
  verifyTransactionPIN(pin: String!): OperationResult!
  sendMoney(input: SendMoneyInput!): SendMoneyResult!
}

# Add to Query type
type Query {
  # ... existing queries
  hasPinSet: Boolean!
}
```

#### Step 5: Rebuild and Restart

```bash
# Stop container
docker stop healthpay-query-service

# Rebuild (if using docker-compose)
docker-compose build --no-cache query-service
docker-compose up -d query-service

# OR rebuild manually
docker build -f packages/query-service/Dockerfile -t healthpay-query:latest .
docker run -d --name healthpay-query-service \
  --network healthpay_network \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://healthpay:password@healthpay-postgres:5432/healthpay_ledger" \
  -e JWT_SECRET="your-secret" \
  --restart unless-stopped \
  healthpay-query:latest
```

---

## ✅ Verification Tests

After deployment, run these tests:

### Test 1: Set Transaction PIN

```bash
# Get auth token first
TOKEN="your-access-token"

curl -X POST http://104.248.245.150:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"mutation { setTransactionPIN(input: {pin: \"1234\", confirmPin: \"1234\"}) { success message } }"}'

# Expected: {"data":{"setTransactionPIN":{"success":true,"message":"تم إنشاء رمز PIN بنجاح"}}}
```

### Test 2: Send Money

```bash
# Check balance before
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ getWallet { balance availableBalance } }"}'

# Send money
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"mutation { sendMoney(input: {recipientPhone: \"01110047666\", amount: 10, pin: \"1234\"}) { success message newBalance } }"}'

# Check balance after (should be reduced by 10)
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ getWallet { balance availableBalance } }"}'
```

### Test 3: Verify Database

```bash
# Check transaction record has balance fields
docker exec -i healthpay-postgres psql -U healthpay -d healthpay_ledger -c \
  "SELECT sender_wallet_id, recipient_wallet_id, sender_balance_before, sender_balance_after 
   FROM transactions 
   ORDER BY created_at DESC 
   LIMIT 1;"

# Should show non-NULL values for all fields
```

---

## 🔍 Troubleshooting

### Issue: "Column does not exist"

**Cause:** Migration not run or incomplete

**Fix:** Re-run migration.sql

### Issue: "Resolver not found"

**Cause:** Resolver not imported in main file

**Fix:** Check that you've added the imports and exports in your main resolver file

### Issue: Container won't start

**Cause:** Syntax error in code

**Fix:** Check Docker logs:
```bash
docker logs healthpay-query-service
```

### Issue: Still not updating balances

**Cause:** Old code still cached

**Fix:** Force rebuild with no cache:
```bash
docker-compose build --no-cache
```

---

## 📊 Expected Results

| Test | Before Fix | After Fix |
|------|-----------|-----------|
| Set PIN | ❌ Schema mismatch error | ✅ Success |
| Send Money | ✅ Success (but no balance change) | ✅ Success + Balance updated |
| Transaction Record | ⚠️ Missing wallet/balance fields | ✅ All fields populated |
| New User Receive | ❌ "Account not active" | ✅ Receives money |

---

## 📞 Support

If you encounter issues:

1. Check Docker logs: `docker logs healthpay-query-service`
2. Verify database migration: Check if columns exist
3. Review the detailed diagnosis reports in this directory
4. Contact the development team with specific error messages

---

**Last Updated:** December 20, 2025  
**Author:** Manus AI
