import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VaultService } from '../vault/vault.service';
import * as crypto from 'crypto';

/**
 * EncryptionService - AES-256-GCM Encryption
 * 
 * Provides secure encryption/decryption for sensitive data.
 * Uses Vault for key management with env fallback.
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;
  private keyCache: Buffer | null = null;

  constructor(
    private vault: VaultService,
    private config: ConfigService,
  ) {}

  /**
   * Get encryption key from Vault or environment
   */
  private async getKey(): Promise<Buffer> {
    if (this.keyCache) return this.keyCache;

    try {
      const keyHex = await this.vault.getSecret(
        'secret/data/encryption-key',
        'ENCRYPTION_KEY'
      );
      
      // Handle both object response and string response
      const keyValue = typeof keyHex === 'object' ? keyHex.key : keyHex;
      
      if (!keyValue) {
        // Generate a default key for development (NOT for production)
        this.logger.warn('No encryption key found - using generated key (dev only)');
        const generatedKey = crypto.randomBytes(32);
        this.keyCache = generatedKey;
        return this.keyCache;
      }
      
      this.keyCache = Buffer.from(keyValue, 'hex');
      return this.keyCache;
    } catch (error) {
      this.logger.error('Failed to get encryption key', error);
      throw new Error('Encryption key not available');
    }
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   * @param plaintext - Text to encrypt
   * @returns Encrypted string in format: iv:authTag:ciphertext
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!plaintext) return null;
    
    // Skip if already encrypted
    if (this.isEncrypted(plaintext)) {
      return plaintext;
    }

    const key = await this.getKey();
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   * @param ciphertext - Encrypted string in format: iv:authTag:ciphertext
   * @returns Decrypted plaintext
   */
  async decrypt(ciphertext: string): Promise<string> {
    if (!ciphertext) return null;
    
    // Return as-is if not encrypted (backward compatibility)
    if (!this.isEncrypted(ciphertext)) {
      return ciphertext;
    }

    try {
      const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
      const key = await this.getKey();
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if a value is already encrypted
   * Pattern: 32 hex chars (IV) : 32 hex chars (authTag) : hex ciphertext
   */
  isEncrypted(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    return /^[a-f0-9]{32}:[a-f0-9]{32}:[a-f0-9]+$/.test(value);
  }

  /**
   * Hash a value using SHA-256 (for non-reversible hashing)
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Clear the key cache (for key rotation)
   */
  clearKeyCache(): void {
    this.keyCache = null;
    this.logger.log('Encryption key cache cleared');
  }
}
