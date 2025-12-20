// =============================================================================
// HEALTHPAY - FIXED setTransactionPIN RESOLVER
// 
// Bug Fixed: Schema-Resolver name mismatch
// 
// Root Causes Fixed:
// 1. Resolver name changed from 'setPin' to 'setTransactionPIN'
// 2. Input structure matches GraphQL schema
// 3. Uses bcryptjs for consistent hashing
//
// File: /app/src/resolvers.ts or /app/src/api/resolvers.ts
// =============================================================================

import bcrypt from 'bcryptjs';
import { db } from './db';

interface SetTransactionPINInput {
  pin: string;
  confirmPin: string;
}

interface ResolverContext {
  user: {
    id: string;
    phoneNumber: string;
  } | null;
}

// =============================================================================
// setTransactionPIN - Set a new PIN for first-time users
// =============================================================================
export const setTransactionPIN = async (
  _: any,
  { input }: { input: SetTransactionPINInput },
  context: ResolverContext
) => {
  // 1. Authentication check
  if (!context.user) {
    throw new Error('Not authenticated');
  }

  const { pin, confirmPin } = input;
  const userId = context.user.id;

  // 2. Validate PIN format
  if (!pin || pin.length !== 4) {
    throw new Error('رمز PIN يجب أن يكون 4 أرقام');
  }

  if (!/^\d{4}$/.test(pin)) {
    throw new Error('رمز PIN يجب أن يحتوي على أرقام فقط');
  }

  // 3. Validate PIN confirmation
  if (pin !== confirmPin) {
    throw new Error('رمز PIN غير متطابق');
  }

  // 4. Check if user exists
  const user = await db.users.findById(userId);
  if (!user) {
    throw new Error('المستخدم غير موجود');
  }

  // 5. Check if PIN already set
  if (user.transaction_pin) {
    throw new Error('رمز PIN موجود بالفعل. استخدم تغيير الرمز');
  }

  // 6. Hash the PIN using bcryptjs (NOT bcrypt)
  const saltRounds = 10;
  const hashedPin = await bcrypt.hash(pin, saltRounds);

  // 7. Update user record
  await db.users.update(userId, {
    transaction_pin: hashedPin,
  });

  return {
    success: true,
    message: 'تم تعيين رمز PIN بنجاح',
  };
};

// =============================================================================
// changeTransactionPIN - Change existing PIN
// =============================================================================
export const changeTransactionPIN = async (
  _: any,
  { input }: { input: { currentPin: string; newPin: string; confirmNewPin: string } },
  context: ResolverContext
) => {
  // 1. Authentication check
  if (!context.user) {
    throw new Error('Not authenticated');
  }

  const { currentPin, newPin, confirmNewPin } = input;
  const userId = context.user.id;

  // 2. Validate new PIN format
  if (!newPin || newPin.length !== 4) {
    throw new Error('رمز PIN الجديد يجب أن يكون 4 أرقام');
  }

  if (!/^\d{4}$/.test(newPin)) {
    throw new Error('رمز PIN يجب أن يحتوي على أرقام فقط');
  }

  // 3. Validate confirmation
  if (newPin !== confirmNewPin) {
    throw new Error('رمز PIN الجديد غير متطابق');
  }

  // 4. Get user
  const user = await db.users.findById(userId);
  if (!user) {
    throw new Error('المستخدم غير موجود');
  }

  // 5. Check if PIN exists
  if (!user.transaction_pin) {
    throw new Error('لا يوجد رمز PIN حالي. قم بإنشاء رمز جديد');
  }

  // 6. Verify current PIN
  const isCurrentPinValid = await bcrypt.compare(currentPin, user.transaction_pin);
  if (!isCurrentPinValid) {
    throw new Error('رمز PIN الحالي غير صحيح');
  }

  // 7. Hash new PIN
  const saltRounds = 10;
  const hashedPin = await bcrypt.hash(newPin, saltRounds);

  // 8. Update user record
  await db.users.update(userId, {
    transaction_pin: hashedPin,
  });

  return {
    success: true,
    message: 'تم تغيير رمز PIN بنجاح',
  };
};

// =============================================================================
// verifyTransactionPIN - Verify PIN (for internal use)
// =============================================================================
export const verifyTransactionPIN = async (
  _: any,
  { input }: { input: { pin: string } },
  context: ResolverContext
) => {
  // 1. Authentication check
  if (!context.user) {
    throw new Error('Not authenticated');
  }

  const { pin } = input;
  const userId = context.user.id;

  // 2. Get user
  const user = await db.users.findById(userId);
  if (!user) {
    throw new Error('المستخدم غير موجود');
  }

  // 3. Check if PIN exists
  if (!user.transaction_pin) {
    return {
      success: false,
      message: 'لم يتم تعيين رمز PIN',
    };
  }

  // 4. Verify PIN
  const isPinValid = await bcrypt.compare(pin, user.transaction_pin);
  
  return {
    success: isPinValid,
    message: isPinValid ? 'رمز PIN صحيح' : 'رمز PIN غير صحيح',
  };
};

// =============================================================================
// hasPinSet - Query to check if user has PIN set
// =============================================================================
export const hasPinSet = async (
  _: any,
  __: any,
  context: ResolverContext
): Promise<boolean> => {
  if (!context.user) {
    throw new Error('Not authenticated');
  }

  const user = await db.users.findById(context.user.id);
  return !!(user && user.transaction_pin);
};

// =============================================================================
// Export all resolvers
// =============================================================================
export default {
  setTransactionPIN,
  changeTransactionPIN,
  verifyTransactionPIN,
  hasPinSet,
  
  // Aliases for backward compatibility
  setPin: setTransactionPIN,
  changePin: changeTransactionPIN,
  verifyPin: verifyTransactionPIN,
};
