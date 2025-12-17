/**
 * Data Migration Script - Encrypt Existing User Data
 * 
 * This script migrates existing unencrypted user data to encrypted format.
 * It processes users in batches to avoid memory issues and database locks.
 * 
 * Usage:
 *   npx ts-node scripts/migrate-encrypt-data.ts
 * 
 * Environment Variables:
 *   DATABASE_URL - Database connection string
 *   ENCRYPTION_KEY - 32-byte hex encryption key
 *   BATCH_SIZE - Number of users per batch (default: 100)
 *   DRY_RUN - Set to 'true' for dry run mode
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100', 10);
const DRY_RUN = process.env.DRY_RUN === 'true';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// Statistics
const stats = {
  processed: 0,
  encrypted: 0,
  skipped: 0,
  errors: 0,
};

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a value using AES-256-GCM
 */
function encrypt(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Check if value is already encrypted
 */
function isEncrypted(value: string): boolean {
  return /^[a-f0-9]{32}:[a-f0-9]{32}:[a-f0-9]+$/.test(value);
}

/**
 * Migrate a batch of users
 */
async function migrateBatch(offset: number, key: Buffer): Promise<number> {
  console.log(`\nProcessing batch starting at offset ${offset}...`);
  
  // Fetch batch of users that need migration
  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          mobile: { not: null },
          // @ts-ignore - custom column
          mobile_encrypted: null,
        },
        {
          nationalId: { not: null },
          // @ts-ignore - custom column
          nationalId_encrypted: null,
        },
      ],
    },
    take: BATCH_SIZE,
    skip: offset,
    select: {
      id: true,
      uid: true,
      mobile: true,
      nationalId: true,
    },
  });
  
  if (users.length === 0) {
    return 0;
  }
  
  for (const user of users) {
    try {
      const updateData: any = {};
      
      // Encrypt mobile if not already encrypted
      if (user.mobile && !isEncrypted(user.mobile)) {
        updateData.mobile_encrypted = encrypt(user.mobile, key);
        console.log(`  User ${user.uid}: Encrypting mobile`);
      }
      
      // Encrypt nationalId if not already encrypted
      if (user.nationalId && !isEncrypted(user.nationalId)) {
        updateData.nationalId_encrypted = encrypt(user.nationalId, key);
        console.log(`  User ${user.uid}: Encrypting nationalId`);
      }
      
      if (Object.keys(updateData).length > 0) {
        if (!DRY_RUN) {
          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }
        stats.encrypted++;
      } else {
        stats.skipped++;
      }
      
      stats.processed++;
    } catch (error) {
      console.error(`  Error processing user ${user.uid}:`, error.message);
      stats.errors++;
    }
  }
  
  return users.length;
}

/**
 * Main migration function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Healthpay Data Encryption Migration');
  console.log('='.repeat(60));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log('');
  
  const key = getEncryptionKey();
  console.log('Encryption key loaded successfully');
  
  let offset = 0;
  let batchCount = 0;
  
  while (true) {
    const processed = await migrateBatch(offset, key);
    
    if (processed === 0) {
      break;
    }
    
    batchCount++;
    offset += BATCH_SIZE;
    
    // Progress update
    console.log(`Batch ${batchCount} complete. Total processed: ${stats.processed}`);
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('Migration Complete');
  console.log('='.repeat(60));
  console.log(`Total Processed: ${stats.processed}`);
  console.log(`Encrypted: ${stats.encrypted}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  
  if (DRY_RUN) {
    console.log('\nThis was a DRY RUN. No changes were made.');
    console.log('Run without DRY_RUN=true to apply changes.');
  }
}

// Run migration
main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
