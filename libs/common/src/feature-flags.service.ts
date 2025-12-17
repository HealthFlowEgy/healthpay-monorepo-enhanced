import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * FeatureFlagsService - Safe Feature Rollout
 * 
 * Provides feature flag functionality for gradual rollout of new features.
 * Supports:
 * - Boolean flags (on/off)
 * - Percentage rollout
 * - User-specific flags
 * - Environment-based flags
 */
@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private flags: Map<string, FeatureFlag> = new Map();
  private userOverrides: Map<string, Map<string, boolean>> = new Map();

  // Default feature flags configuration
  private readonly defaultFlags: Record<string, FeatureFlagConfig> = {
    // Security features
    ENCRYPTION_ENABLED: { defaultValue: false, envKey: 'FEATURE_ENCRYPTION_ENABLED' },
    MFA_ENABLED: { defaultValue: false, envKey: 'FEATURE_MFA_ENABLED' },
    AUDIT_LOGGING_ENABLED: { defaultValue: true, envKey: 'FEATURE_AUDIT_LOGGING' },
    RATE_LIMITING_ENABLED: { defaultValue: true, envKey: 'FEATURE_RATE_LIMITING' },
    
    // New features
    WALLET_SUBSCRIPTION: { defaultValue: false, envKey: 'FEATURE_WALLET_SUBSCRIPTION' },
    EARLY_PAYMENT: { defaultValue: false, envKey: 'FEATURE_EARLY_PAYMENT' },
    AUCTION_SYSTEM: { defaultValue: false, envKey: 'FEATURE_AUCTION_SYSTEM' },
    
    // Operational flags
    MAINTENANCE_MODE: { defaultValue: false, envKey: 'FEATURE_MAINTENANCE_MODE' },
    DEBUG_MODE: { defaultValue: false, envKey: 'DEBUG' },
  };

  constructor(private config: ConfigService) {
    this.initializeFlags();
  }

  /**
   * Initialize flags from environment variables
   */
  private initializeFlags(): void {
    for (const [name, config] of Object.entries(this.defaultFlags)) {
      const envValue = this.config.get(config.envKey);
      const value = envValue !== undefined 
        ? this.parseBoolean(envValue) 
        : config.defaultValue;
      
      this.flags.set(name, {
        name,
        enabled: value,
        percentage: config.percentage || 100,
        description: config.description || '',
      });
      
      this.logger.log(`Feature flag ${name}: ${value ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagName: string, userId?: string): boolean {
    // Check user-specific override first
    if (userId) {
      const userFlags = this.userOverrides.get(userId);
      if (userFlags?.has(flagName)) {
        return userFlags.get(flagName);
      }
    }

    const flag = this.flags.get(flagName);
    if (!flag) {
      this.logger.warn(`Unknown feature flag: ${flagName}`);
      return false;
    }

    // If percentage rollout, check if user is in the percentage
    if (flag.percentage < 100 && userId) {
      return this.isUserInPercentage(userId, flag.percentage);
    }

    return flag.enabled;
  }

  /**
   * Check multiple flags at once
   */
  getFlags(flagNames: string[], userId?: string): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const name of flagNames) {
      result[name] = this.isEnabled(name, userId);
    }
    return result;
  }

  /**
   * Get all flags status
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [name, flag] of this.flags) {
      result[name] = flag.enabled;
    }
    return result;
  }

  /**
   * Set a user-specific override
   */
  setUserOverride(userId: string, flagName: string, enabled: boolean): void {
    if (!this.userOverrides.has(userId)) {
      this.userOverrides.set(userId, new Map());
    }
    this.userOverrides.get(userId).set(flagName, enabled);
    this.logger.log(`User override set: ${userId} -> ${flagName}: ${enabled}`);
  }

  /**
   * Remove a user-specific override
   */
  removeUserOverride(userId: string, flagName: string): void {
    const userFlags = this.userOverrides.get(userId);
    if (userFlags) {
      userFlags.delete(flagName);
    }
  }

  /**
   * Update a flag at runtime
   */
  updateFlag(flagName: string, enabled: boolean, percentage?: number): void {
    const flag = this.flags.get(flagName);
    if (flag) {
      flag.enabled = enabled;
      if (percentage !== undefined) {
        flag.percentage = percentage;
      }
      this.logger.log(`Flag updated: ${flagName} -> ${enabled} (${percentage || 100}%)`);
    }
  }

  /**
   * Determine if user is in percentage rollout
   */
  private isUserInPercentage(userId: string, percentage: number): boolean {
    // Create deterministic hash from userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Map to 0-100 range
    const userPercentile = Math.abs(hash % 100);
    return userPercentile < percentage;
  }

  /**
   * Parse boolean from string
   */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  }

  /**
   * Execute code only if feature is enabled
   */
  async whenEnabled<T>(
    flagName: string,
    enabledFn: () => Promise<T>,
    disabledFn?: () => Promise<T>,
    userId?: string,
  ): Promise<T | null> {
    if (this.isEnabled(flagName, userId)) {
      return enabledFn();
    }
    return disabledFn ? disabledFn() : null;
  }
}

// Types
interface FeatureFlag {
  name: string;
  enabled: boolean;
  percentage: number;
  description: string;
}

interface FeatureFlagConfig {
  defaultValue: boolean;
  envKey: string;
  percentage?: number;
  description?: string;
}
