import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VaultService } from './vault/vault.service';
import { EncryptionService } from './encryption/encryption.service';
import { MfaService } from './mfa/mfa.service';
import { AuditService } from './audit/audit.service';
import { PrismaService } from '@app/prisma';

/**
 * SecurityModule - Global Security Services
 * 
 * This module provides security-related services globally across the application:
 * - VaultService: Secret management with env fallback
 * - EncryptionService: AES-256-GCM encryption
 * - MfaService: TOTP-based multi-factor authentication
 * - AuditService: Security audit logging
 * 
 * Usage:
 * Import SecurityModule in your AppModule and inject services where needed.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    VaultService,
    EncryptionService,
    MfaService,
    AuditService,
  ],
  exports: [
    VaultService,
    EncryptionService,
    MfaService,
    AuditService,
  ],
})
export class SecurityModule {}
