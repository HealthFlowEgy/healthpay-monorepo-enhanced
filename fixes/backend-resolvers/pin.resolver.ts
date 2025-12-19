// =============================================================================
// HEALTHPAY - SET PIN RESOLVER
// 
// Allows users to set or update their transaction PIN
//
// File: packages/query-service/src/resolvers/pin.resolver.ts
// =============================================================================

import bcrypt from 'bcryptjs';

// =============================================================================
// SET PIN MUTATION
// =============================================================================

export const pinResolver = {
  Mutation: {
    // Set PIN for the first time
    setPin: async (
      _: any,
      { input }: { input: SetPinInput },
      { db, user }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { pin, confirmPin } = input;

      // Validate PIN format
      if (!/^\d{4,6}$/.test(pin)) {
        throw new Error('PIN must be 4-6 digits');
      }

      // Confirm PIN match
      if (pin !== confirmPin) {
        throw new Error('PINs do not match');
      }

      // Check if PIN already set
      const currentUser = await db.users.findUnique({
        where: { id: user.id },
      });

      if (currentUser?.transaction_pin) {
        throw new Error('PIN already set. Use changePin to update.');
      }

      // Hash and save PIN
      const hashedPin = await bcrypt.hash(pin, 10);

      await db.users.update({
        where: { id: user.id },
        data: {
          transaction_pin: hashedPin,
          updated_at: new Date(),
        },
      });

      console.log('[SetPin] PIN set for user:', user.id);

      return {
        success: true,
        message: 'PIN set successfully',
      };
    },

    // Change existing PIN
    changePin: async (
      _: any,
      { input }: { input: ChangePinInput },
      { db, user }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { currentPin, newPin, confirmNewPin } = input;

      // Validate new PIN format
      if (!/^\d{4,6}$/.test(newPin)) {
        throw new Error('New PIN must be 4-6 digits');
      }

      // Confirm new PIN match
      if (newPin !== confirmNewPin) {
        throw new Error('New PINs do not match');
      }

      // Get user with current PIN
      const currentUser = await db.users.findUnique({
        where: { id: user.id },
      });

      if (!currentUser?.transaction_pin) {
        throw new Error('No PIN set. Use setPin first.');
      }

      // Verify current PIN
      const isCurrentPinValid = await bcrypt.compare(currentPin, currentUser.transaction_pin);
      if (!isCurrentPinValid) {
        throw new Error('Current PIN is incorrect');
      }

      // Hash and save new PIN
      const hashedNewPin = await bcrypt.hash(newPin, 10);

      await db.users.update({
        where: { id: user.id },
        data: {
          transaction_pin: hashedNewPin,
          updated_at: new Date(),
        },
      });

      console.log('[ChangePin] PIN changed for user:', user.id);

      return {
        success: true,
        message: 'PIN changed successfully',
      };
    },

    // Verify PIN (for checking before transactions)
    verifyPin: async (
      _: any,
      { pin }: { pin: string },
      { db, user }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const currentUser = await db.users.findUnique({
        where: { id: user.id },
      });

      if (!currentUser?.transaction_pin) {
        return {
          valid: false,
          message: 'PIN not set',
          hasPinSet: false,
        };
      }

      const isValid = await bcrypt.compare(pin, currentUser.transaction_pin);

      return {
        valid: isValid,
        message: isValid ? 'PIN verified' : 'Invalid PIN',
        hasPinSet: true,
      };
    },
  },

  Query: {
    // Check if user has PIN set
    hasPinSet: async (
      _: any,
      __: any,
      { db, user }: Context
    ) => {
      if (!user) {
        throw new Error('Not authenticated');
      }

      const currentUser = await db.users.findUnique({
        where: { id: user.id },
        select: { transaction_pin: true },
      });

      return !!currentUser?.transaction_pin;
    },
  },
};

// =============================================================================
// TYPES
// =============================================================================

interface SetPinInput {
  pin: string;
  confirmPin: string;
}

interface ChangePinInput {
  currentPin: string;
  newPin: string;
  confirmNewPin: string;
}

interface Context {
  db: any;
  user: any;
}

// =============================================================================
// GRAPHQL SCHEMA ADDITIONS
// =============================================================================

/*
# Add to schema.graphql:

input SetPinInput {
  pin: String!
  confirmPin: String!
}

input ChangePinInput {
  currentPin: String!
  newPin: String!
  confirmNewPin: String!
}

type PinResponse {
  success: Boolean!
  message: String
}

type VerifyPinResponse {
  valid: Boolean!
  message: String
  hasPinSet: Boolean!
}

type Query {
  hasPinSet: Boolean!
}

type Mutation {
  setPin(input: SetPinInput!): PinResponse!
  changePin(input: ChangePinInput!): PinResponse!
  verifyPin(pin: String!): VerifyPinResponse!
}
*/

export default pinResolver;
