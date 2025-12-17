import { Injectable, Logger } from '@nestjs/common';
import { EncryptionService } from '../encryption/encryption.service';
import * as crypto from 'crypto';

/**
 * MfaService - Multi-Factor Authentication
 * 
 * Provides TOTP-based MFA functionality including:
 * - Secret generation
 * - QR code generation
 * - Token verification
 * - Backup codes
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly TOTP_STEP = 30; // 30 second window
  private readonly TOTP_DIGITS = 6;
  private readonly BACKUP_CODE_COUNT = 10;

  constructor(private encryption: EncryptionService) {}

  /**
   * Generate a new MFA secret for a user
   */
  async generateSecret(userId: string, email: string): Promise<{
    secret: string;
    qrCode: string;
    otpauthUrl: string;
  }> {
    // Generate a random secret (20 bytes = 32 base32 characters)
    const secretBuffer = crypto.randomBytes(20);
    const secret = this.base32Encode(secretBuffer);
    
    // Create otpauth URL
    const issuer = 'Healthpay';
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${this.TOTP_DIGITS}&period=${this.TOTP_STEP}`;
    
    // Generate QR code as data URL
    const qrCode = await this.generateQRCode(otpauthUrl);
    
    // Encrypt the secret before storing
    const encryptedSecret = await this.encryption.encrypt(secret);
    
    return {
      secret: encryptedSecret,
      qrCode,
      otpauthUrl,
    };
  }

  /**
   * Verify a TOTP token
   */
  async verifyToken(encryptedSecret: string, token: string): Promise<boolean> {
    try {
      const secret = await this.encryption.decrypt(encryptedSecret);
      
      // Allow for clock drift (1 step before and after)
      for (let i = -1; i <= 1; i++) {
        const expectedToken = this.generateTOTP(secret, i);
        if (expectedToken === token) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      this.logger.error('MFA verification failed', error);
      return false;
    }
  }

  /**
   * Generate backup codes for account recovery
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Encrypt backup codes for storage
   */
  async encryptBackupCodes(codes: string[]): Promise<string> {
    return this.encryption.encrypt(JSON.stringify(codes));
  }

  /**
   * Verify a backup code
   */
  async verifyBackupCode(
    encryptedCodes: string,
    code: string,
  ): Promise<{ valid: boolean; remainingCodes: string }> {
    const codesJson = await this.encryption.decrypt(encryptedCodes);
    const codes: string[] = JSON.parse(codesJson);
    
    const codeIndex = codes.indexOf(code.toUpperCase());
    
    if (codeIndex === -1) {
      return { valid: false, remainingCodes: encryptedCodes };
    }
    
    // Remove used code
    codes.splice(codeIndex, 1);
    const remainingCodes = await this.encryption.encrypt(JSON.stringify(codes));
    
    return { valid: true, remainingCodes };
  }

  /**
   * Generate TOTP token
   */
  private generateTOTP(secret: string, offset: number = 0): string {
    const time = Math.floor(Date.now() / 1000 / this.TOTP_STEP) + offset;
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeBigInt64BE(BigInt(time));
    
    const secretBuffer = this.base32Decode(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    const offset_val = hash[hash.length - 1] & 0x0f;
    const code = (
      ((hash[offset_val] & 0x7f) << 24) |
      ((hash[offset_val + 1] & 0xff) << 16) |
      ((hash[offset_val + 2] & 0xff) << 8) |
      (hash[offset_val + 3] & 0xff)
    ) % Math.pow(10, this.TOTP_DIGITS);
    
    return code.toString().padStart(this.TOTP_DIGITS, '0');
  }

  /**
   * Base32 encode
   */
  private base32Encode(buffer: Buffer): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    
    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;
      
      while (bits >= 5) {
        bits -= 5;
        result += alphabet[(value >> bits) & 0x1f];
      }
    }
    
    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 0x1f];
    }
    
    return result;
  }

  /**
   * Base32 decode
   */
  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;
    
    for (const char of encoded.toUpperCase()) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      
      value = (value << 5) | index;
      bits += 5;
      
      if (bits >= 8) {
        bits -= 8;
        bytes.push((value >> bits) & 0xff);
      }
    }
    
    return Buffer.from(bytes);
  }

  /**
   * Generate QR code as data URL
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      // Try to use qrcode library if available
      const QRCode = await import('qrcode');
      return QRCode.toDataURL(data);
    } catch {
      // Fallback: return the URL for manual entry
      this.logger.warn('QRCode library not available, returning otpauth URL');
      return `data:text/plain;base64,${Buffer.from(data).toString('base64')}`;
    }
  }
}
