/**
 * Oracle Executor Service
 * 
 * Executes function calls safely with RBAC enforcement
 * This is the bridge between AI intent and actual database queries
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OracleSecurityService } from './oracle-security.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractStatus } from '@prisma/client';
import { RagService } from '../../ai/rag/rag.service';

@Injectable()
export class OracleExecutorService {
    private readonly logger = new Logger(OracleExecutorService.name);

    constructor(
        private securityService: OracleSecurityService,
        private prisma: PrismaService,
        private ragService: RagService,
    ) { }

    /**
     * Execute count_contracts function
     */
    async countContracts(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            status?: ContractStatus;
            createdToday?: boolean;
            expiringDays?: number;
            minAmount?: number;
        }
    ): Promise<{ count: number; scope: string }> {
        const scope = this.securityService.determineScope(permissions);

        const filters: any = {};
        if (args.status) filters.status = args.status;
        if (args.minAmount) filters.minAmount = args.minAmount;
        if (args.expiringDays) filters.expiringDays = args.expiringDays;

        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            filters
        );

        let filtered = contracts;
        if (args.createdToday) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = contracts.filter(c => c.createdAt >= today);
        }

        this.logger.log(`Counted ${filtered.length} contracts for user ${userId}`);
        return { count: filtered.length, scope };
    }

    /**
     * Execute list_contracts function
     */
    async listContracts(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            status?: ContractStatus[];
            expiringDays?: number;
            minAmount?: number;
            maxAmount?: number;
            searchTerm?: string;
            limit?: number;
        }
    ): Promise<{ contracts: any[]; scope: string }> {
        const scope = this.securityService.determineScope(permissions);

        const filters: any = {
            ...(args.expiringDays && { expiringDays: args.expiringDays }),
            ...(args.minAmount && { minAmount: args.minAmount }),
            ...(args.maxAmount && { maxAmount: args.maxAmount }),
            ...(args.searchTerm && { searchTerm: args.searchTerm }),
            limit: Math.min(args.limit || 10, 50) // Cap at 50
        };

        // Handle array status
        if (args.status && args.status.length > 0) {
            filters.status = args.status;
        }

        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            filters
        );

        const sanitized = this.securityService.sanitizeForAI(contracts);

        this.logger.log(`Listed ${contracts.length} contracts for user ${userId}`);
        return { contracts: sanitized, scope };
    }

    /**
     * Execute get_contract_details function
     */
    async getContractDetails(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            contractId?: string;
            reference?: string;
        }
    ): Promise<{ contract: any | null; scope: string }> {
        const scope = this.securityService.determineScope(permissions);

        const filters: any = {};
        if (args.contractId) filters.searchTerm = args.contractId;
        if (args.reference) filters.reference = args.reference;

        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            filters
        );

        if (contracts.length === 0) {
            this.logger.warn(`Contract not found or access denied for user ${userId}`);
            return { contract: null, scope };
        }

        const sanitized = this.securityService.sanitizeForAI(contracts)[0];
        return { contract: sanitized, scope };
    }

    /**
     * Execute get_contracts_created_today function
     */
    async getContractsCreatedToday(
        userId: string,
        organizationId: string,
        permissions: string[]
    ): Promise<{ contracts: any[]; count: number; scope: string }> {
        const scope = this.securityService.determineScope(permissions);

        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            { limit: 50 }
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayContracts = contracts.filter(c => c.createdAt >= today);

        const sanitized = this.securityService.sanitizeForAI(todayContracts);

        return { contracts: sanitized, count: todayContracts.length, scope };
    }

    /**
     * Execute get_expiring_contracts function
     */
    async getExpiringContracts(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: { days?: number }
    ): Promise<{ contracts: any[]; scope: string }> {
        const scope = this.securityService.determineScope(permissions);
        const days = args.days || 30;

        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            { expiringDays: days }
        );

        const sanitized = this.securityService.sanitizeForAI(contracts);

        return { contracts: sanitized, scope };
    }

    /**
     * Execute count_users function
     */
    async countUsers(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            role?: string;
            activeOnly?: boolean;
        }
    ): Promise<{ count: number; scope: string; error?: string }> {
        // Check permission - "user:view" is the correct code from seed.ts
        if (!permissions.includes('user:view') && !permissions.includes('org:manage')) {
            return { count: 0, scope: 'DENIED', error: 'You don\'t have permission to view user information' };
        }

        const where: any = {
            organizationRoles: {
                some: {
                    organizationId,
                    isActive: true
                }
            }
        };

        if (args.activeOnly !== false) {
            where.isActive = true;
            where.status = 'ACTIVE';
        }

        if (args.role) {
            where.organizationRoles.some.role = {
                code: args.role
            };
        }

        const count = await this.prisma.user.count({ where });

        this.logger.log(`Counted ${count} users for org ${organizationId}`);
        return { count, scope: 'ORG_WIDE' };
    }

    /**
     * Execute list_users function
     */
    async listUsers(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            role?: string;
            permission?: string;
            activeOnly?: boolean;
            limit?: number;
        }
    ): Promise<{ users: any[]; scope: string; error?: string }> {
        // Check permission - "user:view" is the correct code from seed.ts
        if (!permissions.includes('user:view') && !permissions.includes('org:manage')) {
            return { users: [], scope: 'DENIED', error: 'You don\'t have permission to view user information' };
        }

        const where: any = {
            organizationRoles: {
                some: {
                    organizationId,
                    isActive: true
                }
            }
        };

        if (args.activeOnly !== false) {
            where.isActive = true;
            where.status = 'ACTIVE';
        }

        if (args.role) {
            where.organizationRoles.some.role = {
                code: args.role
            };
        }

        // Fetch users with role information
        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                lastLoginAt: true,
                organizationRoles: {
                    where: { organizationId },
                    select: {
                        role: {
                            select: {
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            },
            take: Math.min(args.limit || 20, 50),
            orderBy: { name: 'asc' }
        });

        // Sanitize based on permissions
        const isAdmin = permissions.includes('MANAGE_ORGANIZATION') || permissions.includes('VIEW_USER_DETAILS');

        const sanitized = users.map(user => {
            const roles = user.organizationRoles.map(r => r.role.name).join(', ');

            if (isAdmin) {
                // Admin/HR sees full details
                return {
                    name: user.name,
                    email: user.email,
                    role: roles,
                    status: user.status,
                    lastLogin: user.lastLoginAt
                };
            } else {
                // Regular users see limited info
                return {
                    name: user.name,
                    role: roles
                };
            }
        });

        this.logger.log(`Listed ${sanitized.length} users for org ${organizationId}`);
        return { users: sanitized, scope: 'ORG_WIDE' };
    }

    /**
     * Execute count_contract_versions function
     */
    async countContractVersions(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            reference: string;
        }
    ): Promise<{ count: number; scope: string; error?: string }> {
        // First check if user has access to this contract
        const scope = this.securityService.determineScope(permissions);
        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            { reference: args.reference }
        );

        if (contracts.length === 0) {
            return { count: 0, scope: 'DENIED', error: 'Contract not found or access denied' };
        }

        const contract = contracts[0];

        // Count versions
        const count = await this.prisma.contractVersion.count({
            where: { contractId: contract.id }
        });

        this.logger.log(`Counted ${count} versions for contract ${args.reference}`);
        return { count, scope };
    }

    /**
     * Execute list_contract_versions function
     */
    async listContractVersions(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            reference: string;
            limit?: number;
        }
    ): Promise<{ versions: any[]; scope: string; reference?: string; error?: string }> {
        // Check access
        const scope = this.securityService.determineScope(permissions);
        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            { reference: args.reference }
        );

        if (contracts.length === 0) {
            this.logger.warn(`Contract ${args.reference} not found for user ${userId} (Scope: ${scope})`);
            return {
                versions: [],
                scope,
                error: `Contract ${args.reference} not found (Scope: ${scope})`
            };
        }

        const contract = contracts[0];

        // Fetch versions
        const versions = await this.prisma.contractVersion.findMany({
            where: { contractId: contract.id },
            select: {
                versionNumber: true,
                changeLog: true,
                createdAt: true,
                createdByUserId: true
            },
            orderBy: { versionNumber: 'desc' },
            take: Math.min(args.limit || 20, 50)
        });

        // Sanitize for AI
        const sanitized = versions.map(v => ({
            version: v.versionNumber,
            changes: v.changeLog ? (typeof v.changeLog === 'string' ? v.changeLog : JSON.stringify(v.changeLog)) : 'No changelog',
            changeLog: v.changeLog,
            createdAt: v.createdAt,
            createdBy: v.createdByUserId,
            contractId: contract.id   // Added for frontend navigation
        }));

        this.logger.log(`Listed ${versions.length} versions for contract ${args.reference}`);
        return { versions: sanitized, scope: 'ORG_WIDE', reference: args.reference };
    }

    /**
     * Execute list_global_versions function (New for "Instant" queries)
     */
    async listGlobalRecentVersions(
        userId: string,
        organizationId: string,
        permissions: string[],
        limit: number = 5
    ): Promise<{ versions: any[]; scope: string }> {
        // Check access generally
        const scope = this.securityService.determineScope(permissions);

        const where: any = {
            contract: {
                organizationId
            }
        };

        if (scope === 'USER_ONLY') {
            where.contract.createdByUserId = userId;
        }

        const versions = await this.prisma.contractVersion.findMany({
            where,
            include: {
                contract: {
                    select: {
                        title: true,
                        reference: true,
                        id: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        const sanitized = versions.map(v => ({
            version: v.versionNumber,
            contractTitle: v.contract.title, // Include title for context
            contractReference: v.contract.reference, // Include ref
            contractId: v.contract.id,
            changes: v.changeLog ? (typeof v.changeLog === 'string' ? v.changeLog : JSON.stringify(v.changeLog)) : 'No changes recorded',
            changeLog: v.changeLog,
            createdAt: v.createdAt,
            createdBy: v.createdByUserId
        }));

        return { versions: sanitized, scope };
    }

    /**
     * Execute get_version_changelog function
     */
    async getVersionChangelog(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            reference: string;
            versionNumber: number;
        }
    ): Promise<{ changelog: any; scope: string; error?: string }> {
        // Check access
        const scope = this.securityService.determineScope(permissions);
        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            { reference: args.reference }
        );

        if (contracts.length === 0) {
            return { changelog: null, scope: 'DENIED', error: 'Contract not found or access denied' };
        }

        const contract = contracts[0];

        // Fetch specific version
        const version = await this.prisma.contractVersion.findUnique({
            where: {
                contractId_versionNumber: {
                    contractId: contract.id,
                    versionNumber: args.versionNumber
                }
            },
            select: {
                versionNumber: true,
                changeLog: true,
                createdAt: true,
                createdByUserId: true
            }
        });

        if (!version) {
            return { changelog: null, scope, error: `Version ${args.versionNumber} not found` };
        }

        const changelog = {
            version: version.versionNumber,
            changes: version.changeLog,
            createdAt: version.createdAt,
            createdBy: version.createdByUserId
        };

        this.logger.log(`Retrieved changelog for contract ${args.reference} version ${args.versionNumber}`);
        return { changelog, scope };
    }

    /**
     * Execute search_contracts function (RAG)
     */
    async searchContracts(
        userId: string,
        organizationId: string,
        permissions: string[],
        args: {
            query: string;
            limit?: number;
        }
    ): Promise<{ results: any[]; scope: string; error?: string }> {
        // Enforce RBAC fence first
        const scope = this.securityService.determineScope(permissions);

        // Fetch ALL allowed contract IDs for this user
        const contracts = await this.securityService.fetchAllowedContracts(
            userId,
            organizationId,
            scope,
            {}
        );

        if (contracts.length === 0) {
            return { results: [], scope, error: "No contracts found or access denied" };
        }

        const allowedIds = contracts.map(c => c.id);

        // Perform Vector Search
        const chunks = await this.ragService.search(args.query, allowedIds, args.limit || 5);

        if (chunks.length === 0) {
            return { results: [], scope };
        }

        // Enrich with contract metadata
        const hitContractIds = [...new Set(chunks.map(c => c.contractId))];
        const hitContracts = await this.prisma.contract.findMany({
            where: { id: { in: hitContractIds } },
            select: { id: true, title: true, reference: true }
        });
        const contractMap = new Map(hitContracts.map(c => [c.id, c]));

        const results = chunks.map(chunk => ({
            text: chunk.content,
            contract: contractMap.get(chunk.contractId) || { id: chunk.contractId, title: 'Unknown' },
            similarity: chunk.similarity
        }));

        this.logger.log(`Semantic search found ${chunks.length} chunks for user ${userId}`);
        return { results, scope };
    }

    /**
     * Route and execute function call
     */
    async execute(
        functionName: string,
        args: any,
        userId: string,
        organizationId: string,
        permissions: string[]
    ): Promise<any> {
        this.logger.log(`Executing function: ${functionName} for user ${userId}`);

        switch (functionName) {
            case 'count_contracts':
                return this.countContracts(userId, organizationId, permissions, args);

            case 'list_contracts':
                return this.listContracts(userId, organizationId, permissions, args);

            case 'get_contract_details':
                return this.getContractDetails(userId, organizationId, permissions, args);

            case 'get_contracts_created_today':
                return this.getContractsCreatedToday(userId, organizationId, permissions);

            case 'get_expiring_contracts':
                return this.getExpiringContracts(userId, organizationId, permissions, args);

            case 'count_users':
                return this.countUsers(userId, organizationId, permissions, args);

            case 'list_users':
                return this.listUsers(userId, organizationId, permissions, args);

            case 'count_contract_versions':
                return this.countContractVersions(userId, organizationId, permissions, args);

            case 'list_contract_versions':
                return this.listContractVersions(userId, organizationId, permissions, args);

            case 'get_version_changelog':
                return this.getVersionChangelog(userId, organizationId, permissions, args);

            case 'search_contracts':
                return this.searchContracts(userId, organizationId, permissions, args);

            default:
                throw new Error(`Unknown function: ${functionName}`);
        }
    }
}
