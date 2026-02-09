import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

/**
 * Analytics Service with Redis caching
 * Reduces database load for expensive aggregation queries
 */
@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        private prisma: PrismaService,
        private cache: CacheService,
    ) { }

    /**
     * Get contract summary with caching (5 min TTL)
     */
    async getContractsSummary(organizationId: string, userId?: string) {
        // [Debug] Cache Buster V2
        const cacheKey = userId
            ? `analytics:v2:contracts:summary:${organizationId}:${userId}`
            : `analytics:v2:contracts:summary:${organizationId}`;

        // [Debug] Log to file
        const fs = require('fs');
        const path = require('path');
        const logFile = path.join(process.cwd(), 'analytics_debug.log');
        const log = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

        log(`Request: Org=${organizationId}, User=${userId}`);

        return this.cache.wrap(cacheKey, async () => {
            log(`Cache Miss - Fetching from DB for ${cacheKey}`);

            const whereClause: any = { organizationId };
            if (userId) {
                whereClause.createdByUserId = userId;
            }

            log(`Query Filter: ${JSON.stringify(whereClause)}`);

            const [total, byStatus, activeValueResult] = await Promise.all([
                // Total contracts
                this.prisma.contract.count({
                    where: whereClause,
                }),

                // Count by status
                this.prisma.contract.groupBy({
                    by: ['status'],
                    where: whereClause,
                    _count: true,
                }),

                // Total Active Value
                this.prisma.contract.aggregate({
                    _sum: { amount: true },
                    where: {
                        ...whereClause,
                        status: { in: ['ACTIVE', 'COUNTERSIGNED', 'APPROVED', 'SENT_TO_COUNTERPARTY'] as any[] }
                    }
                })
            ]);

            log(`Result: Total=${total}, Value=${activeValueResult._sum.amount}`);

            // Convert groupBy to object
            const statusCounts: Record<string, number> = {};
            byStatus.forEach(item => {
                statusCounts[item.status] = item._count;
            });

            return {
                total,
                byStatus: statusCounts,
                pendingApproval: (statusCounts['SENT_TO_LEGAL'] || 0) + (statusCounts['SENT_TO_FINANCE'] || 0),
                active: (statusCounts['ACTIVE'] || 0) + (statusCounts['COUNTERSIGNED'] || 0) + (statusCounts['SENT_TO_COUNTERPARTY'] || 0) + (statusCounts['APPROVED'] || 0),
                activeValue: activeValueResult._sum.amount || 0,
                draft: statusCounts['DRAFT'] || 0,
                rejected: statusCounts['REJECTED'] || 0,
                expired: (statusCounts['EXPIRED'] || 0) + (statusCounts['TERMINATED'] || 0),
            };
        }, 10); // [Debug] Short TTL 10s
    }

    /**
     * Get contracts by status with caching (5 min TTL)
     */
    async getContractsByStatus(organizationId: string, userId?: string) {
        const cacheKey = userId
            ? `analytics:contracts:by-status:${organizationId}:${userId}`
            : `analytics:contracts:by-status:${organizationId}`;

        return this.cache.wrap(cacheKey, async () => {
            const whereClause: any = { organizationId };
            if (userId) {
                whereClause.createdByUserId = userId;
            }

            const result = await this.prisma.contract.groupBy({
                by: ['status'],
                where: whereClause,
                _count: true,
            });

            return result.map(item => ({
                status: item.status,
                count: item._count,
                label: this.formatStatus(item.status),
            }));
        }, 300);
    }

    /**
     * Get monthly contract creation trend with caching (5 min TTL)
     */
    async getContractTrend(organizationId: string, userId?: string) {
        const cacheKey = userId
            ? `analytics:contracts:trend:${organizationId}:${userId}`
            : `analytics:contracts:trend:${organizationId}`;

        return this.cache.wrap(cacheKey, async () => {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const whereClause: any = {
                organizationId,
                createdAt: { gte: sixMonthsAgo },
            };
            if (userId) {
                whereClause.createdByUserId = userId;
            }

            const contracts = await this.prisma.contract.findMany({
                where: whereClause,
                select: { createdAt: true },
            });

            // Group by month
            const monthlyData: Record<string, { count: number }> = {};

            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyData[key] = { count: 0 };
            }

            contracts.forEach(c => {
                const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[key]) {
                    monthlyData[key].count++;
                }
            });

            return Object.entries(monthlyData).map(([month, data]) => ({
                month,
                label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                count: data.count,
            }));
        }, 300);
    }

    /**
     * Get approval metrics with caching (5 min TTL)
     */
    async getApprovalMetrics(organizationId: string, userId?: string) {
        const cacheKey = userId
            ? `analytics:approvals:metrics:${organizationId}:${userId}`
            : `analytics:approvals:metrics:${organizationId}`;

        return this.cache.wrap(cacheKey, async () => {
            const whereClause: any = { organizationId };
            if (userId) {
                // If restricting by user, we only count approvals for THEIR contracts
                // Alternatively, we could count approvals where THEY are the approver?
                // For Dashboard context ("My Operational Snapshot"), it usually means "My Contracts' Approvals"
                whereClause.createdByUserId = userId;
            }

            const [pending, completed] = await Promise.all([
                // Pending approvals
                this.prisma.approval.count({
                    where: {
                        contract: whereClause,
                        status: 'PENDING',
                    },
                }),

                // Completed approvals (all time)
                this.prisma.approval.count({
                    where: {
                        contract: whereClause,
                        status: { in: ['APPROVED', 'REJECTED'] },
                    },
                }),
            ]);

            return {
                pendingCount: pending,
                completedCount: completed,
                averageApprovalTime: 2.5, // Mock - would need actedAt tracking
                approvalRate: completed > 0 ? 0.85 : 0, // Mock approval rate
            };
        }, 300);
    }

    /**
     * Get recent activity (no caching - usually fresh data needed)
     */
    async getRecentActivity(organizationId: string, limit: number = 10, userId?: string) {
        const whereClause: any = { organizationId };
        if (userId) {
            whereClause.createdByUserId = userId;
        }

        const recentContracts = await this.prisma.contract.findMany({
            where: whereClause,
            orderBy: { updatedAt: 'desc' },
            take: limit,
            select: {
                id: true,
                title: true,
                status: true,
                updatedAt: true,
            },
        });

        return recentContracts.map(c => ({
            id: c.id,
            type: 'contract',
            title: c.title,
            status: c.status,
            timestamp: c.updatedAt,
        }));
    }

    /**
     * Get system-wide admin stats with caching (10 min TTL)
     */
    async getAdminStats() {
        const cacheKey = 'analytics:admin:stats:global';

        return this.cache.wrap(cacheKey, async () => {
            const [totalUsers, totalOrgs, totalContracts, totalTemplates, totalPermissions] = await Promise.all([
                this.prisma.user.count(),
                this.prisma.organization.count(),
                this.prisma.contract.count(),
                this.prisma.template.count(),
                this.prisma.permission.count(),
            ]);

            return {
                totalUsers,
                totalOrgs,
                totalContracts,
                totalTemplates,
                totalPermissions,
                systemHealth: '100%',
                lastUpdated: new Date()
            };
        }, 600); // 10 minutes TTL for admin stats
    }

    /**
     * Invalidate cache for an organization
     * Call this when contracts are created/updated
     */
    async invalidateOrganizationCache(organizationId: string) {
        await this.cache.invalidatePattern(`analytics:*:${organizationId}`);
        this.logger.debug(`Invalidated analytics cache for org ${organizationId}`);
    }

    /**
     * Invalidate global admin stats cache
     */
    async invalidateAdminStatsCache() {
        await this.cache.invalidate('analytics:admin:stats:global');
    }

    private formatStatus(status: string): string {
        return status
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
}
