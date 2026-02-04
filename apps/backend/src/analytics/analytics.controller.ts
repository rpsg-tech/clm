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
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    /**
     * Get contract summary statistics
     */
    @Get('contracts/summary')
    @Permissions('analytics:view')
    async getContractSummary(@CurrentUser() user: AuthenticatedUser) {
        return this.analyticsService.getContractsSummary(user.orgId!);
    }

    /**
     * Get contracts by status for chart
     */
    @Get('contracts/by-status')
    @Permissions('analytics:view')
    async getContractsByStatus(@CurrentUser() user: AuthenticatedUser) {
        return this.analyticsService.getContractsByStatus(user.orgId!);
    }

    /**
     * Get monthly contract creation trend
     */
    @Get('contracts/trend')
    @Permissions('analytics:view')
    async getContractTrend(@CurrentUser() user: AuthenticatedUser) {
        return this.analyticsService.getContractTrend(user.orgId!);
    }

    /**
     * Get approval metrics
     */
    @Get('approvals/metrics')
    @Permissions('analytics:view')
    async getApprovalMetrics(@CurrentUser() user: AuthenticatedUser) {
        return this.analyticsService.getApprovalMetrics(user.orgId!);
    }

    /**
     * Get recent activity
     */
    @Get('activity')
    @Permissions('analytics:view')
    async getRecentActivity(
        @CurrentUser() user: AuthenticatedUser,
        @Query('limit') limit = '10',
    ) {
        return this.analyticsService.getRecentActivity(user.orgId!, parseInt(limit));
    }

    /**
     * Get system-wide admin statistics
     */
    @Get('admin/stats')
    // Ideally this should be protected by a SuperAdminGuard
    async getAdminStats() {
        return this.analyticsService.getAdminStats();
    }

    // No longer need formatStatus - it's in the service
}
