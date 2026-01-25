/**
 * Analytics Controller
 * 
 * Dashboard metrics and reporting endpoints.
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class AnalyticsController {
    constructor(private prisma: PrismaService) { }

    /**
     * Get contract summary statistics
     */
    @Get('contracts/summary')
    @Permissions('contract:view')
    async getContractSummary(@CurrentUser() user: AuthenticatedUser) {
        const orgId = user.orgId;

        const [total, byStatus] = await Promise.all([
            // Total contracts
            this.prisma.contract.count({
                where: { organizationId: orgId },
            }),

            // Count by status
            this.prisma.contract.groupBy({
                by: ['status'],
                where: { organizationId: orgId },
                _count: true,
            }),
        ]);

        // Convert groupBy to object
        const statusCounts: Record<string, number> = {};
        byStatus.forEach(item => {
            statusCounts[item.status] = item._count;
        });

        return {
            total,
            byStatus: statusCounts,
            pendingApproval: (statusCounts['PENDING_LEGAL'] || 0) + (statusCounts['PENDING_FINANCE'] || 0),
            active: (statusCounts['ACTIVE'] || 0) + (statusCounts['SIGNED'] || 0) + (statusCounts['COUNTERSIGNED'] || 0) + (statusCounts['SENT_TO_COUNTERPARTY'] || 0),
            draft: statusCounts['DRAFT'] || 0,
            rejected: statusCounts['REJECTED'] || 0,
            expired: (statusCounts['EXPIRED'] || 0) + (statusCounts['TERMINATED'] || 0),
        };
    }

    /**
     * Get contracts by status for chart
     */
    @Get('contracts/by-status')
    @Permissions('contract:view')
    async getContractsByStatus(@CurrentUser() user: AuthenticatedUser) {
        const result = await this.prisma.contract.groupBy({
            by: ['status'],
            where: { organizationId: user.orgId },
            _count: true,
        });

        return result.map(item => ({
            status: item.status,
            count: item._count,
            label: this.formatStatus(item.status),
        }));
    }

    /**
     * Get monthly contract creation trend
     */
    @Get('contracts/trend')
    @Permissions('contract:view')
    async getContractTrend(@CurrentUser() user: AuthenticatedUser) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const contracts = await this.prisma.contract.findMany({
            where: {
                organizationId: user.orgId,
                createdAt: { gte: sixMonthsAgo },
            },
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
    }

    /**
     * Get approval metrics
     */
    @Get('approvals/metrics')
    @Permissions('approval:legal:view', 'approval:finance:view')
    async getApprovalMetrics(@CurrentUser() user: AuthenticatedUser) {
        const [pending, completed] = await Promise.all([
            // Pending approvals
            this.prisma.approval.count({
                where: {
                    contract: { organizationId: user.orgId },
                    status: 'PENDING',
                },
            }),

            // Completed approvals (all time)
            this.prisma.approval.count({
                where: {
                    contract: { organizationId: user.orgId },
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
    }

    /**
     * Get recent activity
     */
    @Get('activity')
    @Permissions('contract:view')
    async getRecentActivity(
        @CurrentUser() user: AuthenticatedUser,
        @Query('limit') limit = '10',
    ) {
        const recentContracts = await this.prisma.contract.findMany({
            where: { organizationId: user.orgId },
            orderBy: { updatedAt: 'desc' },
            take: parseInt(limit),
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
     * Get system-wide admin statistics
     */
    @Get('admin/stats')
    // Ideally this should be protected by a SuperAdminGuard
    async getAdminStats() {
        // Run parallel queries for system-wide stats
        const [totalUsers, totalOrgs, totalContracts, activeContracts] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.organization.count(),
            this.prisma.contract.count(),
            this.prisma.contract.count({
                where: { status: 'ACTIVE' }
            })
        ]);

        return {
            totalUsers,
            totalOrgs,
            totalContracts,
            activeContracts,
            systemHealth: '100%', // Mock for now
            lastUpdated: new Date()
        };
    }

    private formatStatus(status: string): string {
        return status
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
}
