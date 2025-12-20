# HealthPay Backend - Bug Diagnosis & Code Fixes

## Date: December 20, 2025

## Author: Manus AI

---

## Executive Summary

This report provides a detailed root cause analysis of three critical bugs found in the HealthPay backend system. Each diagnosis includes code snippets, an explanation of the issue, and recommended code fixes for the development team.

| Bug | Severity | Root Cause | Summary |
|---|---|---|---|
| **Send Money** | P0 - CRITICAL | Multiple parameter mismatches and incomplete database queries | `sendMoney` mutation returns success but does not update wallet balances, making the feature non-functional. |
| **Set PIN** | P1 - HIGH | Schema-resolver mismatch | `setTransactionPIN` mutation fails because the schema and resolver have different names and input structures. |
| **User Status** | P2 - MEDIUM | Business logic design | New users are created with `pending` status and cannot receive money until manually activated. |

---

## Bug #1: Send Money - Wallet Balance Not Updating (P0 - CRITICAL)

### Root Cause Analysis

The `sendMoney` mutation fails to update wallet balances due to a cascade of bugs in the resolver and database layer:

1.  **Incomplete Transaction INSERT:** The `db.transactions.create()` method is missing critical wallet-related columns (`sender_wallet_id`, `recipient_wallet_id`, `sender_balance_before`, etc.). This means the transaction record is created without the necessary data to track wallet changes.

2.  **Incorrect `updateBalance()` Parameters:** The `sendMoney` resolver calls `db.wallets.updateBalance()` with the wrong parameters. It passes the *final balance* instead of the *amount to change*, and a number instead of the required `credit` or `debit` string.

3.  **Incorrect `transactions.complete()` Call:** The resolver attempts to update the transaction with balance snapshots by calling `db.transactions.complete()`, but this method only accepts a transaction ID and has no logic to update balance fields.

### Code Fixes

#### Fix 1: Update `transactions.create()` Method
**File:** `/app/src/db.ts`

Expand the `INSERT` statement to include all required wallet and balance columns.

```typescript
// /app/src/db.ts

create: async (data: any) => {
  const { 
    type, status, amount, currency, fee, 
    sender_user_id, recipient_user_id, merchant_id,
    sender_wallet_id, recipient_wallet_id,
    sender_balance_before, sender_balance_after,
    recipient_balance_before, recipient_balance_after,
    reference, description, note, metadata 
  } = data;
  
  return queryOne(
    `INSERT INTO transactions (
      type, status, amount, currency, fee,
      sender_user_id, recipient_user_id, merchant_id,
      sender_wallet_id, recipient_wallet_id,
      sender_balance_before, sender_balance_after,
      recipient_balance_before, recipient_balance_after,
      reference, description, note, metadata,
      created_at, updated_at, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW(), NOW())
    RETURNING *`,
    [
      type, status || 'pending', amount, currency || 'EGP', fee || 0,
      sender_user_id, recipient_user_id, merchant_id,
      sender_wallet_id, recipient_wallet_id,
      sender_balance_before, sender_balance_after,
      recipient_balance_before, recipient_balance_after,
      reference, description, note,
      metadata ? JSON.stringify(metadata) : null
    ]
  );
},
```

#### Fix 2: Refactor `sendMoney` Resolver
**File:** `/app/src/resolvers.ts`

Rewrite the `sendMoney` resolver to use a database transaction (`BEGIN`/`COMMIT`/`ROLLBACK`) and call the database methods with the correct parameters.

```typescript
// /app/src/resolvers.ts

sendMoney: async (_: any, { input }: any, { user }: any) => {
  if (!user) throw new Error('Not authenticated');
  
  const { recipientPhone, amount, pin, note } = input;
  
  // ... (PIN validation, recipient check, balance check) ...
  
  const senderWallet = await db.wallets.findByUserId(user.id);
  const recipientWallet = await db.wallets.findByUserId(recipient.id);
  
  const senderBalanceBefore = parseFloat(senderWallet.balance);
  const recipientBalanceBefore = parseFloat(recipientWallet.balance);
  const senderBalanceAfter = senderBalanceBefore - amount;
  const recipientBalanceAfter = recipientBalanceBefore + amount;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Create transaction record with all data
    await db.transactions.create({
      reference: generateReference('TXN'),
      type: 'transfer_sent',
      status: 'completed',
      amount,
      sender_user_id: user.id,
      recipient_user_id: recipient.id,
      sender_wallet_id: senderWallet.id,
      recipient_wallet_id: recipientWallet.id,
      sender_balance_before: senderBalanceBefore,
      sender_balance_after: senderBalanceAfter,
      recipient_balance_before: recipientBalanceBefore,
      recipient_balance_after: recipientBalanceAfter,
      note,
    });
    
    // 2. Debit sender's wallet
    await db.wallets.updateBalance(senderWallet.id, amount, 'debit');
    
    // 3. Credit recipient's wallet
    await db.wallets.updateBalance(recipientWallet.id, amount, 'credit');
    
    await client.query('COMMIT');
    
    return { success: true, message: 'تم التحويل بنجاح' };
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    throw new Error('فشل التحويل: ' + error.message);
  } finally {
    client.release();
  }
},
```

---

## Bug #2: Set Transaction PIN Mutation Error (P1 - HIGH)

### Root Cause Analysis

The `setTransactionPIN` mutation is failing due to a schema-resolver mismatch:

1.  **Naming Mismatch:** The schema defines `setTransactionPIN`, but the resolver is named `setPin`.
2.  **Input Mismatch:** The schema expects a single `pin` string, while the resolver expects an input object `{ input: { pin, confirmPin } }`.

This causes a runtime error because the resolver cannot destructure the expected input.

### Code Fixes

#### Fix 1: Update GraphQL Schema (Recommended)
**File:** `/app/src/schema.graphql`

Align the schema with the resolver's expectations to include `confirmPin` for security.

```graphql
# /app/src/schema.graphql

input SetTransactionPINInput {
  pin: String!
  confirmPin: String!
}

type Mutation {
  setTransactionPIN(input: SetTransactionPINInput!): OperationResult!
}
```

#### Fix 2: Rename Resolver
**File:** `/app/src/api/resolvers.ts`

Rename the resolver function from `setPin` to `setTransactionPIN` to match the schema.

```typescript
// /app/src/api/resolvers.ts

// Change from:
setPin: async (...)

// To:
setTransactionPIN: async (
  _: any,
  { input }: { input: { pin: string; confirmPin: string } },
  context: ResolverContext
) => {
  // ... existing implementation ...
},
```

---

## Bug #3: User Status Pending (P2 - MEDIUM)

### Root Cause Analysis

This is a business logic issue where the system's design does not align with user expectations:

1.  **Default Status:** New users are created with `status: 'pending'` in the `verifyOTP` resolver.
2.  **Validation:** The `sendMoney` resolver throws an error if the recipient's status is not `active`.

This creates a deadlock where new users cannot receive money without manual admin intervention.

### Code Fixes

#### Fix 1: Auto-Activate New Users (Recommended for MVP)
**File:** `/app/src/resolvers.ts`

Change the default status for new users from `pending` to `active`.

```typescript
// /app/src/resolvers.ts - in verifyOTP resolver

if (!user && dbPurpose === 'login') {
  user = await db.users.create({
    phone_number: formattedPhone,
    first_name: 'مستخدم',
    last_name: 'جديد',
    status: 'active',  // ✅ Changed from 'pending'
    kyc_status: 'not_started',
  });
  
  await db.wallets.create({
    user_id: user.id,
    daily_limit: 500,  // Set a low limit for unverified users
    monthly_limit: 5000,
  });
}
```

#### Fix 2: Update `sendMoney` Validation (Recommended for Production)
**File:** `/app/src/resolvers.ts`

Relax the validation to only block explicitly suspended or deleted users.

```typescript
// /app/src/resolvers.ts - in sendMoney resolver

// Only block if explicitly blocked or deleted
if (recipient.status === 'blocked' || recipient.status === 'deleted') {
  throw new Error('حساب المستلم غير متاح');
}

// Optional: Warn about large transfers to unverified users
if (amount > 1000 && recipient.kyc_status !== 'approved') {
  console.warn(`Large transfer to unverified user: ${recipient.id}`);
}
```

---

## Conclusion

This report has identified three significant bugs in the HealthPay backend. The fixes provided should resolve these issues and improve the stability and functionality of the platform. It is highly recommended to prioritize the fix for the **Send Money** bug (P0) as it is critical to the core functionality of the application.
