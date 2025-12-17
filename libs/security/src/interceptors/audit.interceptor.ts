import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';

/**
 * AuditInterceptor - Automatic Request Audit Logging
 * 
 * Intercepts all HTTP requests and logs them for audit purposes.
 * Can be applied globally or to specific controllers/routes.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private audit: AuditService,
    private config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if audit logging is enabled
    const enabled = this.config.get('FEATURE_AUDIT_LOGGING') !== 'false';
    if (!enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    
    // Extract request info
    const userId = this.extractUserId(request);
    const method = request.method;
    const path = request.path || request.url;
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    
    // Skip health checks and metrics endpoints
    if (this.shouldSkip(path)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        const statusCode = context.switchToHttp().getResponse().statusCode;
        
        await this.audit.logApiRequest(
          userId,
          method,
          path,
          statusCode,
          ipAddress,
          userAgent,
          duration,
        );
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;
        
        await this.audit.logApiRequest(
          userId,
          method,
          path,
          statusCode,
          ipAddress,
          userAgent,
          duration,
        );
        
        throw error;
      }),
    );
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(request: any): string | null {
    // Try to get user from JWT payload
    if (request.user?.id) {
      return String(request.user.id);
    }
    if (request.user?.userId) {
      return String(request.user.userId);
    }
    
    // Try to get from headers
    if (request.headers['x-user-id']) {
      return request.headers['x-user-id'];
    }
    
    return null;
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
   * Check if path should be skipped
   */
  private shouldSkip(path: string): boolean {
    const skipPaths = [
      '/health',
      '/healthz',
      '/ready',
      '/metrics',
      '/favicon.ico',
    ];
    
    return skipPaths.some(skip => path.startsWith(skip));
  }
}
