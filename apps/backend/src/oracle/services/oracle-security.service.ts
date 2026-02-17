/**
 * Oracle Security Service
 * 
 * The RBAC Fence - Ensures AI only accesses data user is authorized to see.
 * This is the CRITICAL security layer that prevents data leakage.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractStatus } from '@prisma/client';

export interface DataScope {
    type: 'ORG_WIDE' | 'USER_ONLY';
    userId: string;
    organizationId: string;
    permissions: string[];
}

export interface FilteredContractData {
    id: string;
    title: string;
    reference: string;
    status: ContractStatus;
    amount: any; // Prisma Decimal type
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    counterpartyName: string | null;
    counterpartyBusinessName: string | null;
}

@Injectable()
export class OracleSecurityService {
    private readonly logger = new Logger(OracleSecurityService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Determine data access scope based on user permissions
     */
    determineScope(permissions: string[]): 'ORG_WIDE' | 'USER_ONLY' {
        // ADMIN, LEGAL, FINANCE can see all org contracts - based on actual seed.ts codes
        const orgWideRoles = [
            'org:view',         // Entity Admin / Super Admin
            'org:manage',       // Entity Admin / Super Admin
            'approval:legal:view',   // Legal Manager
            'approval:finance:view', // Finance Manager
            'system:audit'      // Admins
        ];

        const hasOrgAccess = permissions.some(perm =>
            orgWideRoles.includes(perm)
        );

        return hasOrgAccess ? 'ORG_WIDE' : 'USER_ONLY';
    }

    /**
     * Fetch filtered contract metadata (NEVER content)
     * This is the security fence - enforces RBAC at query level
     */
    async fetchAllowedContracts(
        userId: string,
        organizationId: string,
        scope: 'ORG_WIDE' | 'USER_ONLY',
        filters?: {
            status?: ContractStatus | ContractStatus[];
            expiringDays?: number;
            minAmount?: number;
            maxAmount?: number;
            searchTerm?: string;
            reference?: string;
            limit?: number;
            // New advanced filters
            startDateMin?: string | Date;
            startDateMax?: string | Date;
            endDateMin?: string | Date;
            endDateMax?: string | Date;
            createdSinceDays?: number;
            counterpartyName?: string;
        }
    ): Promise<FilteredContractData[]> {
        const where: any = {
            organizationId
            // NOTE: Contract model doesn't have isActive field
        };

        // RBAC: Business users only see their own contracts
        if (scope === 'USER_ONLY') {
            where.createdByUserId = userId;
        }

        // Apply filters
        if (filters?.status) {
            where.status = Array.isArray(filters.status)
                ? { in: filters.status }
                : filters.status;
        }

        if (filters?.minAmount) {
            where.amount = { ...where.amount, gte: filters.minAmount };
        }

        if (filters?.maxAmount) {
            where.amount = { ...where.amount, lte: filters.maxAmount };
        }

        if (filters?.reference) {
            where.reference = filters.reference;
        }

        if (filters?.searchTerm) {
            where.OR = [
                { title: { contains: filters.searchTerm, mode: 'insensitive' } },
                { reference: { contains: filters.searchTerm, mode: 'insensitive' } },
                { counterpartyName: { contains: filters.searchTerm, mode: 'insensitive' } },
                { counterpartyBusinessName: { contains: filters.searchTerm, mode: 'insensitive' } }
            ];
        }

        if (filters?.counterpartyName) {
            where.OR = [
                ...(where.OR || []),
                { counterpartyName: { contains: filters.counterpartyName, mode: 'insensitive' } },
                { counterpartyBusinessName: { contains: filters.counterpartyName, mode: 'insensitive' } }
            ];
        }

        // Relative Date: Created in the last N days
        if (filters?.createdSinceDays) {
            const sinceDate = new Date();
            sinceDate.setDate(sinceDate.getDate() - filters.createdSinceDays);
            where.createdAt = { ...where.createdAt, gte: sinceDate };
        }

        // Absolute Date Ranges: Start Date
        if (filters?.startDateMin || filters?.startDateMax) {
            where.startDate = {
                ...(filters.startDateMin && { gte: new Date(filters.startDateMin) }),
                ...(filters.startDateMax && { lte: new Date(filters.startDateMax) }),
            };
        }

        // Absolute Date Ranges: End Date
        if (filters?.endDateMin || filters?.endDateMax) {
            where.endDate = {
                ...(filters.endDateMin && { gte: new Date(filters.endDateMin) }),
                ...(filters.endDateMax && { lte: new Date(filters.endDateMax) }),
            };
        }

        if (filters?.expiringDays) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + filters.expiringDays);

            where.endDate = {
                lte: targetDate,
                gte: new Date()
            };
            where.status = 'ACTIVE';
        }

        const contracts = await this.prisma.contract.findMany({
            where,
            select: {
                id: true,
                title: true,
                reference: true,
                status: true,
                amount: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                counterpartyName: true,
                counterpartyBusinessName: true,
                // CRITICAL: Never select content, fieldData, or annexureData
            },
            take: filters?.limit || 50,
            orderBy: { createdAt: 'desc' }
        });

        this.logger.log(`Fetched ${contracts.length} contracts for user ${userId} (scope: ${scope})`);
        return contracts;
    }

    /**
     * Validate AI response doesn't contain unauthorized data
     * Cross-checks contract IDs mentioned in response
     */
    async validateResponse(
        response: string,
        allowedContractIds: string[],
        userId: string
    ): Promise<{ isValid: boolean; sanitized: string }> {
        // Extract potential contract IDs (UUIDs) from response
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        const mentionedIds = response.match(uuidRegex) || [];

        // Check if any mentioned ID is NOT in allowed list
        const unauthorized = mentionedIds.filter(id => !allowedContractIds.includes(id));

        if (unauthorized.length > 0) {
            this.logger.warn(`AI response contained unauthorized contract IDs for user ${userId}: ${unauthorized.join(', ')}`);

            // Sanitize by removing unauthorized IDs
            let sanitized = response;
            unauthorized.forEach(id => {
                sanitized = sanitized.replace(new RegExp(id, 'g'), '[REDACTED]');
            });

            return { isValid: false, sanitized };
        }

        return { isValid: true, sanitized: response };
    }

    /**
     * Sanitize metadata for AI context
     * NEVER include sensitive fields
     */
    sanitizeForAI(contracts: FilteredContractData[]): any[] {
        return contracts.map(c => ({
            id: c.id,
            title: c.title,
            reference: c.reference,
            status: c.status,
            amount: c.amount,
            startDate: c.startDate?.toISOString().split('T')[0],
            endDate: c.endDate?.toISOString().split('T')[0],
            createdAt: c.createdAt.toISOString().split('T')[0],
            counterpartyName: c.counterpartyName || c.counterpartyBusinessName
        }));
    }

    /**
     * Build secure context for AI
     */
    async buildSecureContext(
        userId: string,
        organizationId: string,
        permissions: string[],
        filters?: any
    ) {
        const scope = this.determineScope(permissions);
        const contracts = await this.fetchAllowedContracts(userId, organizationId, scope, filters);

        return {
            scope,
            allowedContractIds: contracts.map(c => c.id),
            metadata: this.sanitizeForAI(contracts),
            count: contracts.length
        };
    }
}
