import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractStatus, Prisma } from '@prisma/client';
import { FeatureFlagService } from '../../config/feature-flag.service';
import { AuditService } from '../../audit/audit.service';

/**
 * Handles contract approval workflows and state transitions
 * Extracted from ContractsService for Single Responsibility Principle
 */
@Injectable()
export class ContractWorkflowService {
    private readonly logger = new Logger(ContractWorkflowService.name);

    constructor(
        private prisma: PrismaService,
        private featureFlagService: FeatureFlagService,
        private auditService: AuditService,
    ) { }

    /**
     * Submit contract for approval (Legal + optional Finance)
     */
    async submitForApproval(contractId: string, organizationId: string, userId: string) {
        const financeEnabled = await this.featureFlagService.isEnabled(
            'FINANCE_WORKFLOW',
            organizationId
        );

        const updatedContract = await this.prisma.$transaction(async (tx) => {
            // Update status
            await tx.contract.update({
                where: { id: contractId },
                data: {
                    status: ContractStatus.IN_REVIEW,
                    submittedAt: new Date(),
                },
            });

            // Clean up old pending approvals
            await tx.approval.deleteMany({
                where: { contractId, status: 'PENDING' }
            });

            // Create new approvals
            const approvalsData = [{ contractId, type: 'LEGAL' }];
            if (financeEnabled) {
                approvalsData.push({ contractId, type: 'FINANCE' });
            }

            await tx.approval.createMany({
                data: approvalsData as any[],
            });

            return tx.contract.findUnique({
                where: { id: contractId },
                include: {
                    approvals: true,
                    createdByUser: {
                        select: { name: true, email: true }
                    }
                },
            });
        });

        // Audit log
        await this.auditService.log({
            organizationId,
            contractId,
            userId,
            action: 'CONTRACT_SUBMITTED',
            module: 'Contracts',
            metadata: { financeEnabled } as Prisma.InputJsonValue,
        });

        this.logger.log(`Contract ${contractId} submitted for review (Finance: ${financeEnabled})`);

        return updatedContract;
    }

    /**
     * Request revision on a contract
     */
    async requestRevision(
        contractId: string,
        userId: string,
        organizationId: string,
        comment: string,
    ) {
        const updated = await this.prisma.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.REVISION_REQUESTED,
            },
            include: { createdByUser: true }
        });

        // Audit log
        await this.auditService.log({
            organizationId,
            contractId,
            userId,
            action: 'CONTRACT_REVISION_REQUESTED',
            module: 'Contracts',
            metadata: { comment } as Prisma.InputJsonValue,
        });

        this.logger.log(`Revision requested on ${contractId} by user ${userId}`);

        return updated;
    }

    /**
     * Send contract to counterparty (status transition)
     */
    async sendToCounterparty(contractId: string) {
        return this.prisma.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.SENT_TO_COUNTERPARTY,
                sentAt: new Date(),
            },
        });
    }

    /**
     * Activate contract after signed document upload
     */
    async activateContract(contractId: string, signedDocumentKey: string) {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            select: { fieldData: true }
        });

        if (!contract) {
            throw new Error('Contract not found');
        }

        return this.prisma.contract.update({
            where: { id: contractId },
            data: {
                status: ContractStatus.ACTIVE,
                signedAt: new Date(),
                fieldData: {
                    ...(contract.fieldData as Prisma.JsonObject),
                    signedContractKey: signedDocumentKey,
                } as Prisma.InputJsonValue,
            },
            include: { createdByUser: true }
        });
    }
}
