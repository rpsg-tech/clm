/**
 * Approvals Service
 * 
 * Handles parallel Legal/Finance approval workflow.
 */

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus, ApprovalType, ContractStatus } from '@prisma/client';

import { EmailService } from '../common/email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApprovalsService {
    private readonly logger = new Logger(ApprovalsService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Approve a contract (Legal or Finance)
     */
    async approve(
        approvalId: string,
        actorId: string,
        organizationId: string,
        comment?: string,
    ) {
        const approval = await this.findApproval(approvalId, organizationId);

        if (approval.status !== ApprovalStatus.PENDING) {
            throw new ForbiddenException('Approval has already been processed');
        }

        return this.prisma.$transaction(async (tx) => {
            // Update approval
            await tx.approval.update({
                where: { id: approvalId },
                data: {
                    status: ApprovalStatus.APPROVED,
                    actorId,
                    actedAt: new Date(),
                    comment,
                },
            });

            // Check if both approvals are complete
            const allApprovals = await tx.approval.findMany({
                where: { contractId: approval.contractId },
            });

            const legalApproval = allApprovals.find((a) => a.type === 'LEGAL');
            const financeApproval = allApprovals.find((a) => a.type === 'FINANCE');

            // Determine new contract status
            let newStatus: ContractStatus;
            let isFullyApproved = false;

            if (
                legalApproval?.status === ApprovalStatus.APPROVED &&
                financeApproval?.status === ApprovalStatus.APPROVED
            ) {
                // Both approved - fully approved
                newStatus = ContractStatus.APPROVED;
                isFullyApproved = true;
            } else if (
                legalApproval?.status === ApprovalStatus.APPROVED &&
                financeApproval?.status === ApprovalStatus.PENDING
            ) {
                newStatus = ContractStatus.LEGAL_APPROVED;
            } else if (
                financeApproval?.status === ApprovalStatus.APPROVED &&
                legalApproval?.status === ApprovalStatus.PENDING
            ) {
                newStatus = ContractStatus.FINANCE_APPROVED;
            } else {
                // Keep current status
                const contract = await tx.contract.findUnique({
                    where: { id: approval.contractId },
                });
                newStatus = contract!.status;
            }

            // Update contract status
            const updatedContract = await tx.contract.update({
                where: { id: approval.contractId },
                data: {
                    status: newStatus,
                    approvedAt: newStatus === ContractStatus.APPROVED ? new Date() : undefined,
                },
                include: { approvals: true, createdByUser: true },
            });

            this.logger.log(
                `Approval ${approval.type} granted for contract ${approval.contractId}. New status: ${newStatus}`,
            );

            // Notify Creator
            if (updatedContract.createdByUser?.email) {
                await this.emailService.sendApprovalResult(
                    updatedContract.createdByUser.email,
                    true,
                    updatedContract.title,
                    'Approver',
                    comment || (isFullyApproved ? 'Fully approved' : `${approval.type} approved`),
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${updatedContract.id}`,
                );

                // Create In-App Notification
                await this.notificationsService.create({
                    userId: updatedContract.createdByUserId,
                    type: 'APPROVAL_COMPLETE',
                    title: `Contract ${isFullyApproved ? 'Approved' : 'Updated'}`,
                    message: `${updatedContract.title} was ${isFullyApproved ? 'fully approved' : `${approval.type} approved`}`,
                    link: `/dashboard/contracts/${updatedContract.id}`,
                });
            }

            return { contract: updatedContract, approval };
        });
    }

    /**
     * Reject a contract
     */
    async reject(
        approvalId: string,
        actorId: string,
        organizationId: string,
        comment: string,
    ) {
        if (!comment) {
            throw new ForbiddenException('Rejection comment is required');
        }

        const approval = await this.findApproval(approvalId, organizationId);

        if (approval.status !== ApprovalStatus.PENDING) {
            throw new ForbiddenException('Approval has already been processed');
        }

        return this.prisma.$transaction(async (tx) => {
            // Update approval
            await tx.approval.update({
                where: { id: approvalId },
                data: {
                    status: ApprovalStatus.REJECTED,
                    actorId,
                    actedAt: new Date(),
                    comment,
                },
            });

            // Update contract status to rejected
            const updatedContract = await tx.contract.update({
                where: { id: approval.contractId },
                data: { status: ContractStatus.REJECTED },
                include: { approvals: true, createdByUser: true },
            });

            this.logger.log(
                `Approval ${approval.type} rejected for contract ${approval.contractId}`,
            );

            // Notify Creator
            if (updatedContract.createdByUser?.email) {
                await this.emailService.sendApprovalResult(
                    updatedContract.createdByUser.email,
                    false,
                    updatedContract.title,
                    'Approver',
                    comment,
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${updatedContract.id}`,
                );

                // Create In-App Notification
                await this.notificationsService.create({
                    userId: updatedContract.createdByUserId,
                    type: 'APPROVAL_COMPLETE',
                    title: 'Contract Rejected',
                    message: `${updatedContract.title} was rejected by ${approval.type}. Reason: ${comment}`,
                    link: `/dashboard/contracts/${updatedContract.id}`,
                });
            }

            return { contract: updatedContract, approval };
        });
    }

    /**
     * Get pending approvals for user (based on role)
     */
    async getPendingApprovals(
        organizationId: string,
        approvalType: ApprovalType,
    ) {
        return this.prisma.approval.findMany({
            where: {
                type: approvalType,
                status: ApprovalStatus.PENDING,
                contract: {
                    organizationId,
                },
            },
            include: {
                contract: {
                    select: {
                        id: true,
                        title: true,
                        reference: true,
                        status: true,
                        createdByUser: { select: { name: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Escalate approval
     */
    async escalate(
        approvalId: string,
        escalatedBy: string,
        escalatedTo: string,
        organizationId: string,
    ) {
        const approval = await this.findApproval(approvalId, organizationId);

        return this.prisma.approval.update({
            where: { id: approvalId },
            data: {
                status: ApprovalStatus.ESCALATED,
                escalatedBy,
                escalatedTo,
                escalatedAt: new Date(),
            },
        });
    }

    /**
     * Find approval with org verification
     */
    private async findApproval(approvalId: string, organizationId: string) {
        const approval = await this.prisma.approval.findUnique({
            where: { id: approvalId },
            include: {
                contract: { select: { organizationId: true } },
            },
        });

        if (!approval) {
            throw new NotFoundException('Approval not found');
        }

        if (approval.contract.organizationId !== organizationId) {
            throw new ForbiddenException('Access denied');
        }

        return approval;
    }
}
