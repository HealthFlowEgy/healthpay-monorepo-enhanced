import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FeatureFlagsService } from './feature-flags.service';

/**
 * CommonModule - Shared Utilities
 * 
 * This module provides common utilities globally across the application:
 * - FeatureFlagsService: Feature flag management for safe rollouts
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class CommonModule {}
