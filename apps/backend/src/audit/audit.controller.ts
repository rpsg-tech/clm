import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from './audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class AuditController {
    constructor(private auditService: AuditService) { }

    /**
     * Get audit logs for the current organization
     */
    @Get()
    @Permissions('audit:view')  // Changed from 'admin:audit:view' to allow org users
    async getAuditLogs(
        @CurrentUser() user: any,
        @Query('module') module?: string,
        @Query('action') action?: string,
        @Query('userId') userId?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        const params = {
            module,
            action,
            userId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            skip: skip ? parseInt(skip, 10) : undefined,
            take: take ? parseInt(take, 10) : 50, // Default limit
        };

        const logs = await this.auditService.getByOrganization(user.orgId, params);

        return {
            logs,
            total: logs.length,
        };
    }
}
