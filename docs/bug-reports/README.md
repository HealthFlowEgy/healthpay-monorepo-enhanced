# HealthPay Backend Bug Fixes

## 📊 Issues Summary

| Bug | Severity | Status | Description |
|-----|----------|--------|-------------|
| sendMoney | P0 CRITICAL | 🔧 FIX PROVIDED | Returns success but doesn't update wallet balances |
| setTransactionPIN | P1 HIGH | 🔧 FIX PROVIDED | Schema/resolver name mismatch |
| User Status | P2 MEDIUM | 🔧 FIX PROVIDED | New users can't receive money |

---

## 🚀 Quick Deploy

### Step 1: Run Database Migration

```bash
ssh root@104.248.245.150

# Run the migration
docker exec -i healthpay-postgres psql -U healthpay -d healthpay_ledger < migration.sql
```

Or copy-paste the SQL directly:

```bash
docker exec -i healthpay-postgres psql -U healthpay -d healthpay_ledger << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS transaction_pin VARCHAR(255);
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
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS available_balance DECIMAL(15,2);
UPDATE transactions SET net_amount = amount WHERE net_amount IS NULL;
UPDATE wallets SET available_balance = balance WHERE available_balance IS NULL;
EOF
```

### Step 2: Update Resolver Code

Copy these files to your project:

```
sendMoney.resolver.ts  → /app/src/resolvers/
pin.resolver.ts        → /app/src/resolvers/
schema-additions.graphql → Merge into schema.graphql
```

### Step 3: Update Main Resolver Index

In your main resolvers file, add:

```typescript
import { sendMoney } from './sendMoney.resolver';
import { 
  setTransactionPIN, 
  changeTransactionPIN, 
  verifyTransactionPIN,
  hasPinSet 
} from './pin.resolver';

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
    // Aliases for backwards compatibility
    setPin: setTransactionPIN,
    changePin: changeTransactionPIN,
    verifyPin: verifyTransactionPIN,
  },
};
```

### Step 4: Rebuild Container

```bash
cd /opt/healthpay/HealthPay-wallet-Re-engineered

# Option A: Docker Compose
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Option B: Direct Docker
docker stop healthpay-query-service
docker rm healthpay-query-service
docker build -f packages/query-service/Dockerfile -t healthpay-query:latest .
docker run -d --name healthpay-query-service \
  --network healthpay_network \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://healthpay:password@healthpay-postgres:5432/healthpay_ledger" \
  -e JWT_SECRET="your-secret" \
  --restart unless-stopped \
  healthpay-query:latest
```

### Step 5: Test the Fixes

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://104.248.245.150:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { verifyOTP(input: {phoneNumber: \"201016464676\", code: \"YOUR_OTP\", purpose: LOGIN}) { accessToken } }"}' \
  | jq -r '.data.verifyOTP.accessToken')

# 2. Set PIN
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"mutation { setTransactionPIN(input: {pin: \"1234\", confirmPin: \"1234\"}) { success message } }"}'

# 3. Check balance before
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ getWallet { balance availableBalance } }"}'

# 4. Send money
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"mutation { sendMoney(input: {recipientPhone: \"01110047666\", amount: 10, pin: \"1234\"}) { success message newBalance } }"}'

# 5. Check balance after (should be 10 less!)
curl -X POST http://104.248.245.150:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ getWallet { balance availableBalance } }"}'
```

---

## 📁 Files in This Package

| File | Description |
|------|-------------|
| `sendMoney.resolver.ts` | Fixed sendMoney that actually updates wallets |
| `pin.resolver.ts` | Fixed setTransactionPIN with correct naming |
| `schema-additions.graphql` | GraphQL schema types to add |
| `migration.sql` | Database migration script |
| `deploy-backend-fixes.sh` | Automated deployment script |
| `README.md` | This file |

---

## 🔍 Root Cause Analysis

### Bug #1: sendMoney Not Updating Balances

**Problem:** The resolver creates a transaction record but never updates wallet balances.

**Code Path:**
```
sendMoney() 
  → db.transactions.create()     ✅ Transaction created
  → db.wallets.updateBalance()   ❌ Called with wrong params
  → db.transactions.complete()   ❌ Method doesn't update balances
```

**Fix:** Use direct SQL updates within a transaction:
```typescript
await client.query('BEGIN');
// Create transaction
// UPDATE sender wallet (debit)
// UPDATE recipient wallet (credit)
await client.query('COMMIT');
```

### Bug #2: setTransactionPIN Failing

**Problem:** Schema defines `setTransactionPIN` but resolver is named `setPin`.

**Schema:**
```graphql
setTransactionPIN(input: SetTransactionPINInput!): OperationResult!
```

**Resolver:**
```typescript
setPin: async (...) // ❌ Wrong name!
```

**Fix:** Rename resolver to match schema exactly.

### Bug #3: User Status Blocking Transfers

**Problem:** New users have `status: 'pending'` and can't receive money.

**Fix Options:**
1. Auto-activate users on registration
2. Relax validation to only block `blocked`/`deleted` users

---

## ✅ Expected Results After Fix

| Test | Before Fix | After Fix |
|------|------------|-----------|
| Set PIN | ❌ Error | ✅ Success |
| Send Money | ❌ Balance unchanged | ✅ Both wallets updated |
| New User Receive | ❌ "Account not active" | ✅ Receives money |

---

## 📞 Support

If issues persist after applying these fixes, check:

1. Docker logs: `docker logs healthpay-query-service`
2. Database state: Check wallet balances directly in PostgreSQL
3. Network: Ensure container can reach database
