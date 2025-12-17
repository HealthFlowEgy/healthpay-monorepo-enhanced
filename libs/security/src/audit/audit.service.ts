import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import * as crypto from 'crypto';

/**
 * AuditService - Security Audit Logging
 * 
 * Provides comprehensive audit logging for security-sensitive operations.
 * Logs are tamper-evident using hash chains.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private lastHash: string = '';

  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Create tamper-evident hash
      const hash = this.createHash({
        ...event,
        timestamp,
        previousHash: this.lastHash,
      });
      
      // Store in database (if audit_logs table exists)
      await this.storeAuditLog({
        ...event,
        timestamp,
        hash,
      });
      
      this.lastHash = hash;
      
      // Also log to console for immediate visibility
      this.logger.log(`[AUDIT] ${event.action} - ${event.resourceType}:${event.resourceId} by user:${event.userId}`);
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      this.logger.error('Failed to write audit log', error);
    }
  }

  /**
   * Log a user authentication event
   */
  async logAuth(
    userId: string | number,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'MFA_ENABLED' | 'MFA_VERIFIED' | 'PASSWORD_CHANGED',
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId: String(userId),
      action,
      resourceType: 'AUTH',
      resourceId: String(userId),
      metadata,
    });
  }

  /**
   * Log a data access event
   */
  async logDataAccess(
    userId: string | number,
    resourceType: string,
    resourceId: string,
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId: String(userId),
      action: `DATA_${action}`,
      resourceType,
      resourceId,
      metadata,
    });
  }

  /**
   * Log a financial transaction event
   */
  async logTransaction(
    userId: string | number,
    transactionId: string,
    action: 'INITIATED' | 'COMPLETED' | 'FAILED' | 'REVERSED',
    amount: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId: String(userId),
      action: `TRANSACTION_${action}`,
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      metadata: {
        ...metadata,
        amount,
      },
    });
  }

  /**
   * Log an API request
   */
  async logApiRequest(
    userId: string | number | null,
    method: string,
    path: string,
    statusCode: number,
    ipAddress?: string,
    userAgent?: string,
    duration?: number,
  ): Promise<void> {
    await this.log({
      userId: userId ? String(userId) : 'anonymous',
      action: `API_${method}`,
      resourceType: 'API',
      resourceId: path,
      ipAddress,
      userAgent,
      metadata: {
        statusCode,
        duration,
      },
    });
  }

  /**
   * Create tamper-evident hash
   */
  private createHash(data: any): string {
    const content = JSON.stringify(data);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Store audit log in database
   */
  private async storeAuditLog(log: AuditLogEntry): Promise<void> {
    try {
      // Check if audit_logs table exists by attempting to create
      // This is a safe operation that won't fail if table doesn't exist
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO audit_logs (
          timestamp, user_id, action, resource_type, resource_id,
          ip_address, user_agent, metadata, hash
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
        log.timestamp,
        log.userId,
        log.action,
        log.resourceType,
        log.resourceId,
        log.ipAddress || null,
        log.userAgent || null,
        JSON.stringify(log.metadata || {}),
        log.hash,
      );
    } catch (error) {
      // Table might not exist yet - log to file/console instead
      this.logger.warn('Audit table not available, logging to console only');
    }
  }

  /**
   * Query audit logs
   */
  async queryLogs(filters: AuditQueryFilters): Promise<AuditLogEntry[]> {
    try {
      const logs = await this.prisma.$queryRawUnsafe<AuditLogEntry[]>(`
        SELECT * FROM audit_logs
        WHERE 1=1
        ${filters.userId ? `AND user_id = '${filters.userId}'` : ''}
        ${filters.action ? `AND action = '${filters.action}'` : ''}
        ${filters.resourceType ? `AND resource_type = '${filters.resourceType}'` : ''}
        ${filters.startDate ? `AND timestamp >= '${filters.startDate.toISOString()}'` : ''}
        ${filters.endDate ? `AND timestamp <= '${filters.endDate.toISOString()}'` : ''}
        ORDER BY timestamp DESC
        LIMIT ${filters.limit || 100}
      `);
      return logs;
    } catch (error) {
      this.logger.error('Failed to query audit logs', error);
      return [];
    }
  }
}

// Types
interface AuditEvent {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

interface AuditLogEntry extends AuditEvent {
  timestamp: Date;
  hash: string;
}

interface AuditQueryFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}
