/**
 * Audit Service
 * 
 * Logs all significant actions for compliance and debugging.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogEntry {
    organizationId?: string;
    contractId?: string;
    userId: string;
    action: string;
    module: string;
    targetType?: string;
    targetId?: string;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Log an audit entry with sanitized metadata
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            // Sanitize metadata before insertion
            const sanitizedEntry = {
                ...entry,
                metadata: entry.metadata ? this.sanitizeMetadata(entry.metadata) : undefined,
                oldValue: entry.oldValue ? this.sanitizeMetadata(entry.oldValue) : undefined,
                newValue: entry.newValue ? this.sanitizeMetadata(entry.newValue) : undefined,
            };

            await this.prisma.auditLog.create({
                data: sanitizedEntry,
            });
        } catch (error) {
            // Log to console but don't fail the main operation
            this.logger.error('Failed to create audit log', error);
        }
    }

    /**
     * Sanitize metadata to prevent log injection and ensure data integrity
     * - Truncates long strings
     * - Limits nested depth
     * - Removes potentially dangerous content
     */
    private sanitizeMetadata(data: any, maxDepth = 3, currentDepth = 0): any {
        if (currentDepth > maxDepth) {
            return '[MAX_DEPTH_EXCEEDED]';
        }

        // Handle null/undefined
        if (data === null || data === undefined) {
            return data;
        }

        // Handle primitives
        if (typeof data === 'string') {
            // Truncate long strings (max 5000 chars per field)
            return data.length > 5000 ? data.substring(0, 5000) + '...[TRUNCATED]' : data;
        }

        if (typeof data === 'number' || typeof data === 'boolean') {
            return data;
        }

        // Handle arrays
        if (Array.isArray(data)) {
            // Limit array size to prevent storage issues
            const maxArrayLength = 100;
            const items = data.slice(0, maxArrayLength).map(item =>
                this.sanitizeMetadata(item, maxDepth, currentDepth + 1)
            );

            if (data.length > maxArrayLength) {
                items.push(`[${data.length - maxArrayLength} MORE ITEMS TRUNCATED]`);
            }

            return items;
        }

        // Handle objects
        if (typeof data === 'object') {
            const sanitized: Record<string, any> = {};
            let fieldCount = 0;
            const maxFields = 50;

            for (const [key, value] of Object.entries(data)) {
                if (fieldCount >= maxFields) {
                    sanitized['__TRUNCATED__'] = `${Object.keys(data).length - maxFields} more fields omitted`;
                    break;
                }

                sanitized[key] = this.sanitizeMetadata(value, maxDepth, currentDepth + 1);
                fieldCount++;
            }

            return sanitized;
        }

        return data;
    }

    /**
     * Get audit logs for an organization
     */
    async getByOrganization(
        organizationId: string,
        params?: {
            module?: string;
            action?: string;
            userId?: string;
            from?: Date;
            to?: Date;
            skip?: number;
            take?: number;
        },
    ) {
        return this.prisma.auditLog.findMany({
            where: {
                organizationId,
                module: params?.module,
                action: params?.action,
                userId: params?.userId,
                createdAt: {
                    gte: params?.from,
                    lte: params?.to,
                },
            },
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: params?.skip !== undefined ? Number(params.skip) : undefined,
            take: params?.take !== undefined ? Number(params.take) : undefined,
        });
    }

    /**
     * Get audit logs for a specific contract
     */
    async getByContract(contractId: string) {
        return this.prisma.auditLog.findMany({
            where: { contractId },
            include: {
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Common audit actions
     */
    static Actions = {
        // Auth
        USER_LOGIN: 'USER_LOGIN',
        USER_LOGOUT: 'USER_LOGOUT',
        ORG_SWITCHED: 'ORG_SWITCHED',

        // Contracts
        CONTRACT_CREATED: 'CONTRACT_CREATED',
        CONTRACT_UPDATED: 'CONTRACT_UPDATED',
        CONTRACT_SUBMITTED: 'CONTRACT_SUBMITTED',
        CONTRACT_APPROVED: 'CONTRACT_APPROVED',
        CONTRACT_REJECTED: 'CONTRACT_REJECTED',
        CONTRACT_SENT: 'CONTRACT_SENT',
        CONTRACT_SIGNED: 'CONTRACT_SIGNED',

        // Templates
        TEMPLATE_CREATED: 'TEMPLATE_CREATED',
        TEMPLATE_UPDATED: 'TEMPLATE_UPDATED',

        // Users
        USER_CREATED: 'USER_CREATED',
        USER_UPDATED: 'USER_UPDATED',
        USER_DEACTIVATED: 'USER_DEACTIVATED',
        ROLE_ASSIGNED: 'ROLE_ASSIGNED',
        ROLE_REMOVED: 'ROLE_REMOVED',

        // AI
        AI_ANALYSIS_REQUESTED: 'AI_ANALYSIS_REQUESTED',
        AI_CHAT_MESSAGE: 'AI_CHAT_MESSAGE',
    };
}
