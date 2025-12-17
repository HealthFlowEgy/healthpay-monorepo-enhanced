import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * VaultService - Secret Management with Fallback
 * 
 * This service provides secure secret management using HashiCorp Vault.
 * If Vault is not configured, it falls back to environment variables
 * for backward compatibility with existing deployments.
 */
@Injectable()
export class VaultService implements OnModuleInit {
  private client: any;
  private readonly logger = new Logger(VaultService.name);
  private cache = new Map<string, { value: any; expiry: number }>();
  private isVaultConfigured = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const vaultAddr = this.config.get('VAULT_ADDR');
    const vaultToken = this.config.get('VAULT_TOKEN');

    // BACKWARD COMPATIBLE: Skip if Vault not configured
    if (!vaultAddr || !vaultToken) {
      this.logger.warn('Vault not configured - using env fallback mode');
      return;
    }

    try {
      // Dynamic import to avoid errors when vault is not installed
      const vault = await import('node-vault');
      this.client = vault.default({
        endpoint: vaultAddr,
        token: vaultToken,
      });
      this.isVaultConfigured = true;
      this.logger.log('Vault client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Vault client', error);
      this.logger.warn('Falling back to environment variables');
    }
  }

  /**
   * Get a secret from Vault with environment variable fallback
   * @param path - Vault secret path
   * @param fallbackEnvKey - Environment variable to use if Vault unavailable
   */
  async getSecret(path: string, fallbackEnvKey?: string): Promise<string> {
    // FALLBACK: Return env var if Vault not available
    if (!this.isVaultConfigured || !this.client) {
      const envValue = this.config.get(fallbackEnvKey || path);
      if (!envValue) {
        this.logger.warn(`Secret not found: ${fallbackEnvKey || path}`);
      }
      return envValue;
    }

    // Check cache first
    const cached = this.cache.get(path);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      const response = await this.client.read(path);
      const secretValue = response.data?.data || response.data;
      
      // Cache for 5 minutes
      this.cache.set(path, {
        value: secretValue,
        expiry: Date.now() + 300000,
      });
      
      return secretValue;
    } catch (error) {
      this.logger.error(`Vault read failed for path: ${path}`, error);
      // Fallback to env
      return this.config.get(fallbackEnvKey || path);
    }
  }

  /**
   * Check if Vault is configured and available
   */
  isAvailable(): boolean {
    return this.isVaultConfigured;
  }

  /**
   * Clear the secret cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Secret cache cleared');
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(paths: { path: string; fallback: string }[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const { path, fallback } of paths) {
      results[path] = await this.getSecret(path, fallback);
    }
    
    return results;
  }
}
