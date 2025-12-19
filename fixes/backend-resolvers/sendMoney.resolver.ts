// =============================================================================
// HEALTHPAY - SENDMONEY RESOLVER FIX
// 
// Problems Fixed:
// 1. Wallet balances not updating after transfer
// 2. Transaction.netAmount field missing
// 3. Proper error handling and validation
//
// File: packages/query-service/src/resolvers/transfer.resolver.ts
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// =============================================================================
// SEND MONEY MUTATION - COMPLETE FIX
// =============================================================================

export const sendMoneyResolver = {
  Mutation: {
    sendMoney: async (
      _: any,
      { input }: { input: SendMoneyInput },
      { db, user }: Context
    ) => {
      // 1. Validate authentication
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { recipientPhone, amount, pin, description } = input;

      console.log('[SendMoney] Starting transfer:', {
        sender: user.id,
        recipient: recipientPhone,
        amount,
      });

      // 2. Validate amount
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // 3. Get sender with wallet
      const sender = await db.users.findUnique({
        where: { id: user.id },
        include: { wallets: true },
      });

      if (!sender) {
        throw new Error('Sender not found');
      }

      const senderWallet = sender.wallets?.[0];
      if (!senderWallet) {
        throw new Error('Sender wallet not found');
      }

      // 4. Verify PIN
      if (!sender.transaction_pin) {
        throw new Error('Transaction PIN not set. Please set your PIN first.');
      }

      const isPinValid = await bcrypt.compare(pin, sender.transaction_pin);
      if (!isPinValid) {
        throw new Error('Invalid PIN');
      }

      // 5. Check balance
      const currentBalance = Number(senderWallet.available_balance || senderWallet.balance || 0);
      if (currentBalance < amount) {
        throw new Error(`Insufficient balance. Available: ${currentBalance} EGP`);
      }

      // 6. Format recipient phone
      let formattedPhone = recipientPhone.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '20' + formattedPhone.substring(1);
      }
      if (!formattedPhone.startsWith('20')) {
        formattedPhone = '20' + formattedPhone;
      }

      // 7. Find recipient
      const recipient = await db.users.findFirst({
        where: {
          OR: [
            { phone_number: formattedPhone },
            { phone_number: '+' + formattedPhone },
            { phone_number: recipientPhone },
          ],
        },
        include: { wallets: true },
      });

      if (!recipient) {
        throw new Error('Recipient not found. They must have a HealthPay account.');
      }

      if (recipient.id === sender.id) {
        throw new Error('Cannot transfer to yourself');
      }

      const recipientWallet = recipient.wallets?.[0];
      if (!recipientWallet) {
        throw new Error('Recipient wallet not found');
      }

      // 8. Calculate fees (0 for now, can be configured)
      const feePercent = 0;
      const feeAmount = Math.round(amount * feePercent * 100) / 100;
      const netAmount = amount - feeAmount;

      console.log('[SendMoney] Transfer details:', {
        senderBalance: currentBalance,
        amount,
        fee: feeAmount,
        netAmount,
        recipientId: recipient.id,
      });

      // 9. Create transaction record
      const transactionId = uuidv4();
      const now = new Date();

      try {
        // Use transaction to ensure atomicity
        const result = await db.$transaction(async (tx: any) => {
          // 9a. Deduct from sender
          const newSenderBalance = currentBalance - amount;
          await tx.wallets.update({
            where: { id: senderWallet.id },
            data: {
              balance: newSenderBalance,
              available_balance: newSenderBalance,
              updated_at: now,
            },
          });

          console.log('[SendMoney] Sender balance updated:', {
            from: currentBalance,
            to: newSenderBalance,
          });

          // 9b. Add to recipient
          const recipientBalance = Number(recipientWallet.available_balance || recipientWallet.balance || 0);
          const newRecipientBalance = recipientBalance + netAmount;
          await tx.wallets.update({
            where: { id: recipientWallet.id },
            data: {
              balance: newRecipientBalance,
              available_balance: newRecipientBalance,
              updated_at: now,
            },
          });

          console.log('[SendMoney] Recipient balance updated:', {
            from: recipientBalance,
            to: newRecipientBalance,
          });

          // 9c. Create transaction record for sender (DEBIT)
          const senderTransaction = await tx.transactions.create({
            data: {
              id: transactionId,
              wallet_id: senderWallet.id,
              user_id: sender.id,
              type: 'TRANSFER_OUT',
              amount: amount,
              fee_amount: feeAmount,
              net_amount: netAmount,
              currency: 'EGP',
              status: 'COMPLETED',
              description: description || `تحويل إلى ${recipient.full_name || recipient.phone_number}`,
              recipient_id: recipient.id,
              recipient_phone: recipient.phone_number,
              balance_before: currentBalance,
              balance_after: newSenderBalance,
              created_at: now,
              updated_at: now,
            },
          });

          // 9d. Create transaction record for recipient (CREDIT)
          await tx.transactions.create({
            data: {
              id: uuidv4(),
              wallet_id: recipientWallet.id,
              user_id: recipient.id,
              type: 'TRANSFER_IN',
              amount: netAmount,
              fee_amount: 0,
              net_amount: netAmount,
              currency: 'EGP',
              status: 'COMPLETED',
              description: description || `تحويل من ${sender.full_name || sender.phone_number}`,
              sender_id: sender.id,
              sender_phone: sender.phone_number,
              balance_before: recipientBalance,
              balance_after: newRecipientBalance,
              reference_id: transactionId,
              created_at: now,
              updated_at: now,
            },
          });

          return senderTransaction;
        });

        console.log('[SendMoney] Transfer completed successfully:', transactionId);

        // 10. Return success response
        return {
          success: true,
          message: 'Transfer completed successfully',
          transaction: {
            id: result.id,
            type: 'TRANSFER_OUT',
            amount: amount,
            feeAmount: feeAmount,
            netAmount: netAmount,
            currency: 'EGP',
            status: 'COMPLETED',
            description: result.description,
            recipientName: recipient.full_name || 'مستخدم',
            recipientPhone: recipient.phone_number,
            createdAt: result.created_at,
          },
          newBalance: currentBalance - amount,
        };

      } catch (error: any) {
        console.error('[SendMoney] Transaction failed:', error);
        throw new Error('Transfer failed: ' + error.message);
      }
    },
  },
};

// =============================================================================
// TYPES
// =============================================================================

interface SendMoneyInput {
  recipientPhone: string;
  amount: number;
  pin: string;
  description?: string;
}

interface Context {
  db: any;
  user: any;
}

// =============================================================================
// GRAPHQL SCHEMA ADDITIONS
// Add these to your schema.graphql file
// =============================================================================

/*
# Add to schema.graphql:

type Transaction {
  id: ID!
  walletId: String!
  userId: String!
  type: TransactionType!
  amount: Float!
  feeAmount: Float
  netAmount: Float!          # <-- THIS WAS MISSING
  currency: String!
  status: TransactionStatus!
  description: String
  recipientId: String
  recipientPhone: String
  recipientName: String
  senderId: String
  senderPhone: String
  senderName: String
  referenceId: String
  balanceBefore: Float
  balanceAfter: Float
  createdAt: DateTime!
  updatedAt: DateTime
}

enum TransactionType {
  TOPUP
  TRANSFER_IN
  TRANSFER_OUT
  PAYMENT
  REFUND
  WITHDRAWAL
  CREDIT
  DEBIT
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}

input SendMoneyInput {
  recipientPhone: String!
  amount: Float!
  pin: String!
  description: String
}

type SendMoneyResponse {
  success: Boolean!
  message: String
  transaction: Transaction
  newBalance: Float
}

type Mutation {
  sendMoney(input: SendMoneyInput!): SendMoneyResponse!
}
*/

export default sendMoneyResolver;
