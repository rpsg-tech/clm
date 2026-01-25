/**
 * Contracts Controller
 * 
 * With comprehensive audit logging for all operations.
 */

import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class ContractsController {
    constructor(
        private readonly contractsService: ContractsService,
        private readonly auditService: AuditService,
    ) { }

    @Post()
    @Permissions('contract:create')
    async create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() createDto: CreateContractDto,
    ) {
        const contract = await this.contractsService.create(user.orgId!, user.id, {
            ...createDto,
            fieldData: createDto.fieldData as Prisma.InputJsonValue,
        });

        // Audit log
        await this.auditService.log({
            organizationId: user.orgId,
            contractId: contract.id,
            userId: user.id,
            action: AuditService.Actions.CONTRACT_CREATED,
            module: 'contracts',
            targetType: 'Contract',
            targetId: contract.id,
            newValue: { title: contract.title, reference: contract.reference } as Prisma.InputJsonValue,
        });

        return contract;
    }

    @Get()
    @Permissions('contract:view')
    async findAll(
        @CurrentUser() user: AuthenticatedUser,
        @Query('status') status?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.contractsService.findByOrganization(user.orgId!, {
            status: status as any,
            skip: page && limit ? (page - 1) * limit : undefined,
            take: limit,
        });
    }

    @Get(':id')
    @Permissions('contract:view')
    async findOne(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ) {
        return this.contractsService.findById(id, user.orgId!);
    }

    @Put(':id')
    @Permissions('contract:edit')
    async update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() updateDto: UpdateContractDto,
    ) {
        // Get old value for audit
        const oldContract = await this.contractsService.findById(id, user.orgId!);

        const contract = await this.contractsService.update(id, user.orgId!, user.id, {
            ...updateDto,
            fieldData: updateDto.fieldData as Prisma.InputJsonValue | undefined,
        });

        // Audit log
        await this.auditService.log({
            organizationId: user.orgId,
            contractId: id,
            userId: user.id,
            action: AuditService.Actions.CONTRACT_UPDATED,
            module: 'contracts',
            targetType: 'Contract',
            targetId: id,
            oldValue: { title: oldContract.title, status: oldContract.status } as Prisma.InputJsonValue,
            newValue: { title: contract.title, status: contract.status } as Prisma.InputJsonValue,
        });

        return contract;
    }

    @Post(':id/submit')
    @Permissions('contract:submit')
    async submitForApproval(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ) {
        const contract = await this.contractsService.submitForApproval(id, user.orgId!);

        // Audit log
        await this.auditService.log({
            organizationId: user.orgId,
            contractId: id,
            userId: user.id,
            action: AuditService.Actions.CONTRACT_SUBMITTED,
            module: 'contracts',
            targetType: 'Contract',
            targetId: id,
            metadata: { newStatus: contract?.status || 'PENDING' } as Prisma.InputJsonValue,
        });

        return contract;
    }

    @Post(':id/send')
    @Permissions('contract:send_counterparty')
    async sendToCounterparty(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ) {
        const contract = await this.contractsService.sendToCounterparty(id, user.orgId!);

        // Audit log
        await this.auditService.log({
            organizationId: user.orgId,
            contractId: id,
            userId: user.id,
            action: AuditService.Actions.CONTRACT_SENT,
            module: 'contracts',
            targetType: 'Contract',
            targetId: id,
            metadata: {
                counterparty: contract.counterpartyEmail,
                sentAt: contract.sentAt,
            } as Prisma.InputJsonValue,
        });

        return contract;
    }

    @Post(':id/upload-signed')
    @Permissions('contract:upload_signed')
    async uploadSignedContract(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body('filename') filename: string,
    ) {
        const contract = await this.contractsService.uploadSignedContract(id, user.orgId!, filename || 'signed_contract.pdf');

        // Audit log
        await this.auditService.log({
            organizationId: user.orgId,
            contractId: id,
            userId: user.id,
            action: AuditService.Actions.CONTRACT_SIGNED,
            module: 'contracts',
            targetType: 'Contract',
            targetId: id,
            metadata: {
                filename,
                signedAt: contract.signedAt,
            } as Prisma.InputJsonValue,
        });

        return contract;
    }

    @Get(':id/versions')
    @Permissions('contract:view')
    async getVersions(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ) {
        return this.contractsService.getVersions(id, user.orgId!);
    }

    @Get(':id/versions/:versionId/changelog')
    @Permissions('contract:changelog:view')
    async getVersionChangelog(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Param('versionId') versionId: string,
    ) {
        const changelog = await this.contractsService.getVersionChangelog(id, versionId, user.orgId!);

        // Audit log
        await this.auditService.log({
            organizationId: user.orgId,
            userId: user.id,
            action: 'CHANGELOG_VIEWED',
            module: 'contracts',
            targetType: 'ContractVersion',
            targetId: versionId,
            metadata: {
                contractId: id,
            } as Prisma.InputJsonValue,
        });

        return changelog;
    }

    @Get(':id/compare')
    @Permissions('contract:version:compare')
    async compareVersions(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Query('from') fromVersionId: string,
        @Query('to') toVersionId: string,
    ) {
        const comparison = await this.contractsService.compareVersions(
            id,
            fromVersionId,
            toVersionId,
            user.orgId!,
        );

        // Audit log
        await this.auditService.log({
            organizationId: user.orgId,
            userId: user.id,
            action: 'VERSIONS_COMPARED',
            module: 'contracts',
            targetType: 'Contract',
            targetId: id,
            metadata: {
                fromVersionId,
                toVersionId,
            } as Prisma.InputJsonValue,
        });

        return comparison;
    }
}
