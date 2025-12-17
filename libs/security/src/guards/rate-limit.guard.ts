import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

/**
 * RateLimitGuard - API Rate Limiting
 * 
 * Provides rate limiting for API endpoints using in-memory storage.
 * For production, consider using Redis for distributed rate limiting.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    private reflector: Reflector,
    private config: ConfigService,
  ) {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limiting is enabled
    const enabled = this.config.get('FEATURE_RATE_LIMITING') !== 'false';
    if (!enabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Get rate limit from decorator or use default
    const limit = this.reflector.get<number>('rateLimit', context.getHandler()) || 100;
    const window = this.reflector.get<number>('rateLimitWindow', context.getHandler()) || 60;
    
    // Create unique key based on IP and path
    const ip = this.getClientIp(request);
    const path = request.path || request.url;
    const key = `${ip}:${path}`;
    
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.store.set(key, {
        count: 1,
        resetTime: now + (window * 1000),
      });
      return true;
    }
    
    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      this.logger.warn(`Rate limit exceeded for ${key}: ${entry.count}/${limit}`);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    // Increment counter
    entry.count++;
    this.store.set(key, entry);
    
    return true;
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.store) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Destroy cleanup interval
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Decorator for custom rate limits
import { SetMetadata } from '@nestjs/common';

export const RateLimit = (limit: number, windowSeconds?: number) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata('rateLimit', limit)(target, key, descriptor);
    if (windowSeconds) {
      SetMetadata('rateLimitWindow', windowSeconds)(target, key, descriptor);
    }
    return descriptor;
  };
};
