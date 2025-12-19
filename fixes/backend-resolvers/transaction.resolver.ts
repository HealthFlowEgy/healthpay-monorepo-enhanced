// =============================================================================
// HEALTHPAY - TRANSACTION RESOLVER FIX
// 
// Problem: `Cannot return null for non-nullable field Transaction.netAmount`
// Solution: Add field resolver to provide default value
//
// File: packages/query-service/src/resolvers/transaction.resolver.ts
// =============================================================================

export const transactionResolver = {
  // Field resolvers for Transaction type
  Transaction: {
    // Fix: netAmount field - return amount if not set
    netAmount: (parent: any) => {
      return parent.net_amount ?? parent.netAmount ?? parent.amount ?? 0;
    },

    // Fix: feeAmount field - return 0 if not set
    feeAmount: (parent: any) => {
      return parent.fee_amount ?? parent.feeAmount ?? 0;
    },

    // Map snake_case to camelCase
    walletId: (parent: any) => parent.wallet_id ?? parent.walletId,
    userId: (parent: any) => parent.user_id ?? parent.userId,
    createdAt: (parent: any) => parent.created_at ?? parent.createdAt,
    updatedAt: (parent: any) => parent.updated_at ?? parent.updatedAt,
    recipientId: (parent: any) => parent.recipient_id ?? parent.recipientId,
    recipientPhone: (parent: any) => parent.recipient_phone ?? parent.recipientPhone,
    recipientName: (parent: any) => parent.recipient_name ?? parent.recipientName,
    senderId: (parent: any) => parent.sender_id ?? parent.senderId,
    senderPhone: (parent: any) => parent.sender_phone ?? parent.senderPhone,
    senderName: (parent: any) => parent.sender_name ?? parent.senderName,
    referenceId: (parent: any) => parent.reference_id ?? parent.referenceId,
    balanceBefore: (parent: any) => parent.balance_before ?? parent.balanceBefore,
    balanceAfter: (parent: any) => parent.balance_after ?? parent.balanceAfter,
  },

  Query: {
    // Get transactions for current user
    getTransactions: async (
      _: any,
      { limit = 10, offset = 0, type }: GetTransactionsArgs,
      { db, user }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get user's wallet
      const userWithWallet = await db.users.findUnique({
        where: { id: user.id },
        include: { wallets: true },
      });

      const wallet = userWithWallet?.wallets?.[0];
      if (!wallet) {
        return [];
      }

      // Build query
      const where: any = {
        wallet_id: wallet.id,
      };

      if (type) {
        where.type = type;
      }

      const transactions = await db.transactions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      });

      // Map to ensure all fields have values
      return transactions.map((tx: any) => ({
        id: tx.id,
        walletId: tx.wallet_id,
        userId: tx.user_id,
        type: tx.type,
        amount: Number(tx.amount || 0),
        feeAmount: Number(tx.fee_amount || 0),
        netAmount: Number(tx.net_amount || tx.amount || 0), // Fallback to amount
        currency: tx.currency || 'EGP',
        status: tx.status,
        description: tx.description,
        recipientId: tx.recipient_id,
        recipientPhone: tx.recipient_phone,
        recipientName: tx.recipient_name,
        senderId: tx.sender_id,
        senderPhone: tx.sender_phone,
        senderName: tx.sender_name,
        referenceId: tx.reference_id,
        balanceBefore: tx.balance_before ? Number(tx.balance_before) : null,
        balanceAfter: tx.balance_after ? Number(tx.balance_after) : null,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
      }));
    },

    // Get single transaction
    getTransaction: async (
      _: any,
      { id }: { id: string },
      { db, user }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const transaction = await db.transactions.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Verify ownership
      const userWithWallet = await db.users.findUnique({
        where: { id: user.id },
        include: { wallets: true },
      });

      const wallet = userWithWallet?.wallets?.[0];
      if (transaction.wallet_id !== wallet?.id) {
        throw new Error('Transaction not found');
      }

      return {
        id: transaction.id,
        walletId: transaction.wallet_id,
        userId: transaction.user_id,
        type: transaction.type,
        amount: Number(transaction.amount || 0),
        feeAmount: Number(transaction.fee_amount || 0),
        netAmount: Number(transaction.net_amount || transaction.amount || 0),
        currency: transaction.currency || 'EGP',
        status: transaction.status,
        description: transaction.description,
        recipientId: transaction.recipient_id,
        recipientPhone: transaction.recipient_phone,
        senderId: transaction.sender_id,
        senderPhone: transaction.sender_phone,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      };
    },
  },
};

// =============================================================================
// TYPES
// =============================================================================

interface GetTransactionsArgs {
  limit?: number;
  offset?: number;
  type?: string;
}

interface Context {
  db: any;
  user: any;
}

// =============================================================================
// DATABASE MIGRATION
// Run this SQL if net_amount column doesn't exist
// =============================================================================

/*
-- Add missing columns to transactions table

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15,2);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(15,2) DEFAULT 0;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS balance_before DECIMAL(15,2);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS balance_after DECIMAL(15,2);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);

-- Update existing transactions to have net_amount = amount
UPDATE transactions SET net_amount = amount WHERE net_amount IS NULL;

-- Make net_amount NOT NULL with default
ALTER TABLE transactions 
ALTER COLUMN net_amount SET DEFAULT 0,
ALTER COLUMN net_amount SET NOT NULL;
*/

export default transactionResolver;
