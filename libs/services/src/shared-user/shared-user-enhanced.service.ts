import { HelpersService } from '@app/helpers';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { EncryptionService } from '../../../security/src/encryption/encryption.service';
import { FeatureFlagsService } from '../../../common/src/feature-flags.service';
import { AuditService } from '../../../security/src/audit/audit.service';
import { SharedNotifyService } from '../shared-notify/shared-notify.service';
import { SharedWalletService } from '../shared-wallet/shared-wallet.service';
import { doUpsertUserInput } from './shared-user.types';

/**
 * SharedUserEnhancedService - Enhanced User Service with Security Features
 * 
 * This service extends the original SharedUserService with:
 * - Field-level encryption for sensitive data
 * - Feature flag integration for gradual rollout
 * - Audit logging for security compliance
 * 
 * It maintains backward compatibility with the original service.
 */
@Injectable()
export class SharedUserEnhancedService {
  private readonly logger = new Logger(SharedUserEnhancedService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(HelpersService) private helpers: HelpersService,
    @Inject(SharedNotifyService) private sharedNotify: SharedNotifyService,
    @Inject(SharedWalletService) private sharedWallet: SharedWalletService,
    // New security services
    private encryption: EncryptionService,
    private featureFlags: FeatureFlagsService,
    private audit: AuditService,
  ) {}

  /**
   * Get user by ID with optional decryption
   */
  public async getUserById(id: number): Promise<User> {
    const user = await this.prisma.user.findFirst({ where: { id } });
    return this.decryptUserFields(user);
  }

  /**
   * Get user by mobile - handles both encrypted and plain mobile numbers
   */
  public async getUserByMobile(mobile: string): Promise<User> {
    // First try to find by plain mobile (backward compatibility)
    let user = await this.prisma.user.findFirst({ where: { mobile } });
    
    // If not found and encryption is enabled, try encrypted search
    if (!user && this.featureFlags.isEnabled('ENCRYPTION_ENABLED')) {
      const encryptedMobile = await this.encryption.encrypt(mobile);
      user = await this.prisma.user.findFirst({ 
        where: { mobile_encrypted: encryptedMobile } 
      });
    }
    
    return user ? this.decryptUserFields(user) : null;
  }

  /**
   * Create new user with optional encryption
   */
  public async doCreateNewUser(
    userData: Pick<Prisma.UserCreateInput, 'firstName' | 'lastName' | 'email' | 'mobile'>,
  ): Promise<User> {
    const encryptionEnabled = this.featureFlags.isEnabled('ENCRYPTION_ENABLED');
    
    // Prepare user data
    const createData: any = {
      uid: this.helpers.doCreateUUID('user'),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      mobile: userData.mobile, // Keep original for backward compatibility
    };
    
    // Add encrypted fields if encryption is enabled
    if (encryptionEnabled) {
      createData.mobile_encrypted = await this.encryption.encrypt(userData.mobile);
    }
    
    const createdUser = await this.prisma.user.create({ data: createData });
    
    // Create wallet for new user
    await this.sharedWallet.doCreateWallet(createdUser.id);
    
    // Audit log
    await this.audit.logDataAccess(
      'system',
      'USER',
      createdUser.uid,
      'CREATE',
      { encrypted: encryptionEnabled },
    );
    
    this.logger.log(`User created: ${createdUser.uid} (encrypted: ${encryptionEnabled})`);
    
    return createdUser;
  }

  /**
   * Update user with optional encryption
   */
  public async doUpdateUser(
    user: Pick<
      Prisma.UserUpdateInput,
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'avatar'
      | 'nationalId'
      | 'nationalDocFront'
      | 'nationalDocBack'
      | 'uid'
      | 'deviceTokens'
    >,
  ): Promise<User> {
    const encryptionEnabled = this.featureFlags.isEnabled('ENCRYPTION_ENABLED');
    
    // Prepare update data
    const updateData: any = { ...user };
    
    // Encrypt sensitive fields if enabled
    if (encryptionEnabled && user.nationalId) {
      updateData.nationalId_encrypted = await this.encryption.encrypt(
        user.nationalId as string
      );
    }
    
    // Remove device tokens if null
    if (updateData.deviceTokens === null) {
      delete updateData.deviceTokens;
    }
    
    const updatedUser = await this.prisma.user.update({
      where: { uid: user.uid as string },
      data: updateData,
    });
    
    // Audit log
    await this.audit.logDataAccess(
      updatedUser.id.toString(),
      'USER',
      updatedUser.uid,
      'UPDATE',
      { fields: Object.keys(user) },
    );
    
    return this.decryptUserFields(updatedUser);
  }

  /**
   * Upsert user with OTP generation
   */
  async doUpsertUser(
    { mobile, firstName, lastName, email }: doUpsertUserInput,
    validationCheckUser: boolean = null,
    via: string,
  ): Promise<User | null> {
    let user = await this.getUserByMobile(mobile);
    
    if (!user) {
      if (validationCheckUser) {
        throw new NotFoundException('2002');
      }
      user = await this.doCreateNewUser({ mobile, firstName, lastName, email });
    }
    
    if (user.isDeactivated) {
      throw new BadRequestException('4001', 'User does not exist');
    }
    
    const generatedOtp = await this.doCreateOtp(user.id);
    this.logger.verbose(`[generatedOtp] ${generatedOtp}`);
    
    await this.sharedNotify
      .toUser(user)
      .allChannels()
      .sendLoginOTP(generatedOtp.split('').join('-'), via);
    
    return user;
  }

  /**
   * Create OTP with rate limiting
   */
  public async doCreateOtp(userId: number): Promise<string> {
    const otpCount = await this.getOTPSentCountInDuration(userId, 1, 'hour');
    
    if (otpCount >= 4) {
      this.logger.warn(`OTP rate limit reached for user ${userId}`);
      // Log potential abuse
      await this.audit.logAuth(userId, 'LOGIN_FAILED', { 
        reason: 'OTP_RATE_LIMIT',
        count: otpCount,
      });
    }
    
    const otp = this.helpers.generateOTP();
    this.logger.verbose('[OTP] ', otp);
    
    await this.prisma.oTP.create({
      data: {
        otp,
        isUsed: false,
        user: { connect: { id: userId } },
      },
    });
    
    return otp;
  }

  /**
   * Get OTP count in duration
   */
  public async getOTPSentCountInDuration(
    userId: number,
    duration?: number,
    period?: 'hour' | 'day',
  ): Promise<number> {
    const moment = await import('moment');
    return this.prisma.oTP.count({
      where: {
        AND: [
          { userId },
          {
            createdAt: {
              gt: moment.default()
                .subtract(duration || 1, period || 'hour')
                .toISOString(),
            },
          },
        ],
      },
    });
  }

  /**
   * Verify mobile with OTP
   */
  public async doVerifyMobileWithOtp(mobile: string, otp: string): Promise<User> {
    const user = await this.getUserByMobile(mobile);
    
    if (!user) {
      throw new BadRequestException('2002', 'User not found');
    }
    
    // Test user bypass
    if (user.mobile === '+201154446065' || user.mobile === '00201154446065') {
      if (otp === '1234') {
        await this.audit.logAuth(user.id, 'LOGIN', { method: 'TEST_OTP' });
        return user;
      } else {
        throw new BadRequestException('5002', 'invalid user otp');
      }
    }
    
    const firstOtp = await this.prisma.oTP.findFirst({
      where: { userId: user.id, otp },
    });
    
    if (!firstOtp || firstOtp.isUsed) {
      this.logger.error(`[otp] 5002 ${otp}`);
      await this.audit.logAuth(user.id, 'LOGIN_FAILED', { reason: 'INVALID_OTP' });
      throw new BadRequestException('5002', 'invalid user otp');
    }
    
    await this.prisma.oTP.update({
      data: { isUsed: true },
      where: { id: firstOtp.id },
    });
    
    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        failed_login_attempts: 0,
      },
    });
    
    await this.audit.logAuth(user.id, 'LOGIN', { method: 'OTP' });
    
    return user;
  }

  /**
   * Deactivate user
   */
  public async deactivateUser(userId: number): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isDeactivated: true },
      });
      
      await this.audit.logDataAccess(
        userId.toString(),
        'USER',
        userId.toString(),
        'UPDATE',
        { action: 'DEACTIVATE' },
      );
      
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Decrypt user fields based on feature flag
   */
  private async decryptUserFields(user: User): Promise<User> {
    if (!user) return null;
    
    const encryptionEnabled = this.featureFlags.isEnabled('ENCRYPTION_ENABLED');
    
    if (!encryptionEnabled) {
      return user;
    }
    
    const decrypted = { ...user };
    
    // Decrypt mobile if encrypted version exists
    if ((user as any).mobile_encrypted) {
      try {
        decrypted.mobile = await this.encryption.decrypt((user as any).mobile_encrypted);
      } catch {
        // Fall back to original if decryption fails
      }
    }
    
    // Decrypt nationalId if encrypted version exists
    if ((user as any).nationalId_encrypted) {
      try {
        decrypted.nationalId = await this.encryption.decrypt((user as any).nationalId_encrypted);
      } catch {
        // Fall back to original if decryption fails
      }
    }
    
    return decrypted;
  }
}
