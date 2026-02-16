/**
 * Approvals Controller
 * 
 * With comprehensive audit logging for approval actions.
 */

import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    UseGuards,
    Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ApprovalType, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Controller('approvals')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class ApprovalsController {
    constructor(
        private readonly approvalsService: ApprovalsService,
        private readonly auditService: AuditService,
    ) { }

    @Get('pending')
    @Throttle({ default: { ttl: 60000, limit: 200 } }) // More permissive for read operations
    @Permissions('approval:legal:view', 'approval:finance:view')
    async getPending(
        @CurrentUser() user: AuthenticatedUser,
        @Query('type') type: 'LEGAL' | 'FINANCE',
    ) {
        return this.approvalsService.getPendingApprovals(
            user.orgId!,
            type as ApprovalType,
        );
    }

    @Post(':id/approve')
    @Permissions('approval:legal:act', 'approval:finance:act')
    async approve(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body('comment') comment?: string,
    ) {
        const { contract, approval } = await this.approvalsService.approve(
            id,
            user.id,
            user.orgId!,
            user.permissions,
            comment
        );

        return contract;
    }

    @Post(':id/reject')
    @Permissions('approval:legal:act', 'approval:finance:act')
    async reject(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body('comment') comment: string,
    ) {
        const { contract, approval } = await this.approvalsService.reject(
            id,
            user.id,
            user.orgId!,
            user.permissions,
            comment
        );

        return contract;
    }


    @Post(':id/request-revision')
    @Permissions('approval:legal:act', 'approval:finance:act')
    async requestRevision(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body('comment') comment: string,
    ) {
        const { contract, approval } = await this.approvalsService.requestRevision(
            id,
            user.id,
            user.orgId!,
            user.permissions,
            comment
        );

        return contract;
    }

    @Post(':id/escalate')
    @Permissions('approval:legal:escalate')
    async escalate(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body('escalatedTo') escalatedTo: string,
    ) {
        const contract = await this.approvalsService.escalate(id, user.id, escalatedTo, user.orgId!);

        // Audit log
        await this.auditService.log({
            organizationId: user.orgId,
            contractId: contract.id,
            userId: user.id,
            action: 'APPROVAL_ESCALATED',
            module: 'approvals',
            targetType: 'Approval',
            targetId: id,
            metadata: {
                escalatedTo,
                contractId: contract.id,
            } as Prisma.InputJsonValue,
        });

        return contract;
    }

    /**
     * Escalate contract to Legal Head (Legal Manager only)
     */
    @Post('/contracts/:contractId/escalate-to-legal-head')
    @Permissions('contract:escalate')
    async escalateToLegalHead(
        @CurrentUser() user: AuthenticatedUser,
        @Param('contractId') contractId: string,
        @Body('reason') reason?: string,
    ) {
        const contract = await this.approvalsService.escalateToLegalHead(
            contractId,
            user.id,
            user.orgId!,
            user.permissions,
            reason,
        );

        return contract;
    }

    /**
     * Return contract to Manager (Legal Head)
     */
    @Post(':id/return')
    @Permissions('approval:legal:act')
    async returnToManager(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body('comment') comment: string,
    ) {
        const result = await this.approvalsService.returnToManager(
            id,
            user.id,
            user.orgId!,
            user.permissions,
            comment
        );

        return result.contract;
    }
}
