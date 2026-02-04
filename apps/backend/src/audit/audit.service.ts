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
            console.log('AUDIT LOG ATTEMPT:', JSON.stringify(entry, null, 2));

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
            console.log('AUDIT LOG SUCCESS');
        } catch (error) {
            // Log to console but don't fail the main operation
            this.logger.error('Failed to create audit log', error);
            console.error('Audit Log Error Details:', error);
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
            targetId?: string;
            from?: Date;
            to?: Date;
            skip?: number;
            take?: number;
        },
    ) {
        // Get child organizations to include in the list (Hierarchical view)
        const childOrgs = await this.prisma.organization.findMany({
            where: { parentId: organizationId },
            select: { id: true }
        });

        const orgIds = [organizationId, ...childOrgs.map(o => o.id)];

        return this.prisma.auditLog.findMany({
            where: {
                organizationId: { in: orgIds },
                module: params?.module,
                action: params?.action,
                userId: params?.userId,
                targetId: params?.targetId,
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
     * Calculate granular difference between two objects
     * Returns objects containing ONLY the changed fields.
     */
    static calculateDiff(oldObj: any, newObj: any): { old: any, new: any } {
        const oldDiff: any = {};
        const newDiff: any = {};

        const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

        allKeys.forEach(key => {
            const oldVal = oldObj?.[key];
            const newVal = newObj?.[key];

            // abstract equality check (loose mapping) or deep equality if needed
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                oldDiff[key] = oldVal;
                newDiff[key] = newVal;
            }
        });

        return { old: oldDiff, new: newDiff };
    }

    /**
     * Audit Modules
     */
    static Modules = {
        AUTH: 'AUTH',
        USERS: 'USERS',
        ROLES: 'ROLES',
        CONTRACTS: 'CONTRACTS',
        TEMPLATES: 'TEMPLATES',
        SYSTEM: 'SYSTEM',
        AI: 'AI',
        ORGANIZATIONS: 'ORGANIZATIONS',
    };

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
        CONTRACT_REVISION_REQUESTED: 'CONTRACT_REVISION_REQUESTED',
        CONTRACT_CANCELLED: 'CONTRACT_CANCELLED',

        // Templates
        TEMPLATE_CREATED: 'TEMPLATE_CREATED',
        TEMPLATE_UPDATED: 'TEMPLATE_UPDATED',

        // Users
        USER_CREATED: 'USER_CREATED',
        USER_UPDATED: 'USER_UPDATED',
        USER_DEACTIVATED: 'USER_DEACTIVATED',
        ROLE_ASSIGNED: 'ROLE_ASSIGNED',
        ROLE_REMOVED: 'ROLE_REMOVED',

        // Roles
        ROLE_CREATED: 'ROLE_CREATED',
        ROLE_UPDATED: 'ROLE_UPDATED',
        ROLE_DELETED: 'ROLE_DELETED',

        // System
        FEATURE_FLAG_UPDATED: 'FEATURE_FLAG_UPDATED',

        // AI
        AI_ANALYSIS_REQUESTED: 'AI_ANALYSIS_REQUESTED',
        AI_CHAT_MESSAGE: 'AI_CHAT_MESSAGE',
    };
}
