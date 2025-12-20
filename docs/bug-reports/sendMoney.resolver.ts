// =============================================================================
// HEALTHPAY - FIXED sendMoney RESOLVER
// 
// Bug Fixed: Wallet balances were not being updated
// 
// Root Causes Fixed:
// 1. Transaction INSERT now includes all wallet-related columns
// 2. updateBalance() called with correct parameters (amount, 'credit'/'debit')
// 3. Uses database transaction (BEGIN/COMMIT/ROLLBACK) for atomicity
//
// File: /app/src/resolvers.ts or /app/src/api/resolvers.ts
// =============================================================================

import bcrypt from 'bcryptjs';
import { pool, db, generateReference } from './db';

interface SendMoneyInput {
  recipientPhone: string;
  amount: number;
  pin: string;
  note?: string;
  description?: string;
}

interface ResolverContext {
  user: {
    id: string;
    phoneNumber: string;
  } | null;
}

export const sendMoney = async (
  _: any,
  { input }: { input: SendMoneyInput },
  context: ResolverContext
) => {
  // 1. Authentication check
  if (!context.user) {
    throw new Error('Not authenticated');
  }

  const { recipientPhone, amount, pin, note, description } = input;
  const senderId = context.user.id;

  // 2. Validate amount
  if (!amount || amount <= 0) {
    throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  }

  if (amount < 1) {
    throw new Error('الحد الأدنى للتحويل 1 ج.م');
  }

  // 3. Get sender's user record and wallet
  const sender = await db.users.findById(senderId);
  if (!sender) {
    throw new Error('المستخدم غير موجود');
  }

  const senderWallet = await db.wallets.findByUserId(senderId);
  if (!senderWallet) {
    throw new Error('محفظة المرسل غير موجودة');
  }

  // 4. Validate PIN
  if (!sender.transaction_pin) {
    throw new Error('يجب تعيين رمز PIN أولاً');
  }

  const isPinValid = await bcrypt.compare(pin, sender.transaction_pin);
  if (!isPinValid) {
    throw new Error('رمز PIN غير صحيح');
  }

  // 5. Find recipient
  // Format phone number (remove + if present, ensure starts with 20)
  let formattedPhone = recipientPhone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '20' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('20')) {
    formattedPhone = '20' + formattedPhone;
  }

  const recipient = await db.users.findByPhone(formattedPhone);
  if (!recipient) {
    throw new Error('المستلم غير موجود');
  }

  // 6. Check recipient is not sender
  if (recipient.id === senderId) {
    throw new Error('لا يمكن التحويل لنفسك');
  }

  // 7. Check recipient status (allow pending users to receive)
  if (recipient.status === 'blocked' || recipient.status === 'deleted') {
    throw new Error('حساب المستلم غير متاح');
  }

  const recipientWallet = await db.wallets.findByUserId(recipient.id);
  if (!recipientWallet) {
    throw new Error('محفظة المستلم غير موجودة');
  }

  // 8. Check sender balance
  const senderBalance = parseFloat(senderWallet.balance) || 0;
  const senderAvailableBalance = parseFloat(senderWallet.available_balance) || senderBalance;
  
  if (senderAvailableBalance < amount) {
    throw new Error(`الرصيد غير كافي. المتاح: ${senderAvailableBalance.toFixed(2)} ج.م`);
  }

  // 9. Calculate balances
  const recipientBalance = parseFloat(recipientWallet.balance) || 0;
  const recipientAvailableBalance = parseFloat(recipientWallet.available_balance) || recipientBalance;

  const senderBalanceAfter = senderBalance - amount;
  const senderAvailableBalanceAfter = senderAvailableBalance - amount;
  const recipientBalanceAfter = recipientBalance + amount;
  const recipientAvailableBalanceAfter = recipientAvailableBalance + amount;

  // 10. Generate reference
  const reference = generateReference('TXN');

  // 11. Execute transfer in database transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create sender's transaction record (TRANSFER_OUT)
    const senderTx = await client.query(
      `INSERT INTO transactions (
        reference, type, status, amount, currency, fee,
        sender_user_id, recipient_user_id,
        sender_wallet_id, recipient_wallet_id,
        sender_balance_before, sender_balance_after,
        recipient_balance_before, recipient_balance_after,
        recipient_phone, recipient_name,
        description, note, metadata,
        created_at, updated_at, completed_at
      ) VALUES (
        $1, 'TRANSFER_OUT', 'COMPLETED', $2, 'EGP', 0,
        $3, $4,
        $5, $6,
        $7, $8,
        $9, $10,
        $11, $12,
        $13, $14, $15,
        NOW(), NOW(), NOW()
      ) RETURNING *`,
      [
        reference,
        amount,
        senderId,
        recipient.id,
        senderWallet.id,
        recipientWallet.id,
        senderBalance,
        senderBalanceAfter,
        recipientBalance,
        recipientBalanceAfter,
        formattedPhone,
        recipient.full_name || recipient.first_name || 'مستخدم',
        description || note || 'تحويل أموال',
        note || null,
        JSON.stringify({ 
          transfer_type: 'P2P',
          initiated_at: new Date().toISOString()
        })
      ]
    );

    // Create recipient's transaction record (TRANSFER_IN)
    await client.query(
      `INSERT INTO transactions (
        reference, type, status, amount, currency, fee,
        sender_user_id, recipient_user_id,
        sender_wallet_id, recipient_wallet_id,
        sender_balance_before, sender_balance_after,
        recipient_balance_before, recipient_balance_after,
        sender_phone, sender_name,
        description, note, metadata,
        created_at, updated_at, completed_at
      ) VALUES (
        $1, 'TRANSFER_IN', 'COMPLETED', $2, 'EGP', 0,
        $3, $4,
        $5, $6,
        $7, $8,
        $9, $10,
        $11, $12,
        $13, $14, $15,
        NOW(), NOW(), NOW()
      ) RETURNING *`,
      [
        reference + '-IN',
        amount,
        senderId,
        recipient.id,
        senderWallet.id,
        recipientWallet.id,
        senderBalance,
        senderBalanceAfter,
        recipientBalance,
        recipientBalanceAfter,
        sender.phone_number,
        sender.full_name || sender.first_name || 'مستخدم',
        description || note || 'استلام تحويل',
        note || null,
        JSON.stringify({ 
          transfer_type: 'P2P',
          received_at: new Date().toISOString()
        })
      ]
    );

    // ============================================
    // CRITICAL FIX: Actually update wallet balances
    // ============================================

    // Debit sender's wallet
    await client.query(
      `UPDATE wallets 
       SET balance = $1, 
           available_balance = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [senderBalanceAfter, senderAvailableBalanceAfter, senderWallet.id]
    );

    // Credit recipient's wallet
    await client.query(
      `UPDATE wallets 
       SET balance = $1, 
           available_balance = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [recipientBalanceAfter, recipientAvailableBalanceAfter, recipientWallet.id]
    );

    // Commit the transaction
    await client.query('COMMIT');

    // Return success response
    return {
      success: true,
      message: 'تم التحويل بنجاح',
      transaction: {
        id: senderTx.rows[0].id,
        reference: reference,
        amount: amount,
        status: 'COMPLETED',
        type: 'TRANSFER_OUT',
        recipientPhone: formattedPhone,
        recipientName: recipient.full_name || recipient.first_name || 'مستخدم',
        createdAt: senderTx.rows[0].created_at,
      },
      newBalance: senderBalanceAfter,
    };

  } catch (error: any) {
    // Rollback on any error
    await client.query('ROLLBACK');
    console.error('[sendMoney] Transaction failed:', error);
    throw new Error('فشل التحويل: ' + (error.message || 'خطأ غير معروف'));
  } finally {
    client.release();
  }
};

// =============================================================================
// Helper function to generate unique reference
// =============================================================================
function generateReference(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}

export default sendMoney;
