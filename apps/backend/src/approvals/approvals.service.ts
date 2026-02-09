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
        userPermissions: string[],
        comment?: string,
    ) {
        const approval = await this.findApproval(approvalId, organizationId);

        // Security Check: Ensure user has permission for THIS specific approval type
        const requiredPermission = `approval:${approval.type.toLowerCase()}:act`;
        if (!userPermissions.includes(requiredPermission)) {
            throw new ForbiddenException(`You do not have permission to approve ${approval.type} requests`);
        }

        if (approval.status !== ApprovalStatus.PENDING) {
            throw new ForbiddenException('Approval has already been processed');
        }

        const result = await this.prisma.$transaction(async (tx) => {
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

            // Check if BOTH approvals are currently active (prevent race conditions by re-fetching all)
            const allApprovals = await tx.approval.findMany({
                where: { contractId: approval.contractId },
            });

            // "Gatekeeper" Logic: Check if ALL required approvals are now APPROVED
            const isFullyApproved = allApprovals.every(
                (a) => a.id === approvalId ? true : a.status === ApprovalStatus.APPROVED // Check current (being updated) + others
            );

            // Determine granular status
            // If fully approved -> APPROVED
            // If not, determine intermediate state based on what IS approved
            let newStatus: ContractStatus;

            if (isFullyApproved) {
                newStatus = ContractStatus.APPROVED;
            } else {
                // Check specific combinations for granular status (UI Feedback)
                const legal = allApprovals.find(a => a.type === 'LEGAL');
                const finance = allApprovals.find(a => a.type === 'FINANCE');

                // Note: We use the *projected* status of the current approval being acted on
                const isLegalApproved = legal?.id === approvalId || legal?.status === ApprovalStatus.APPROVED;
                const isFinanceApproved = finance?.id === approvalId || finance?.status === ApprovalStatus.APPROVED;

                if (isLegalApproved && isFinanceApproved) {
                    // Should be covered by isFullyApproved, but safety check
                    newStatus = ContractStatus.APPROVED;
                } else if (isLegalApproved) {
                    newStatus = ContractStatus.LEGAL_APPROVED;
                } else if (isFinanceApproved) {
                    newStatus = ContractStatus.FINANCE_REVIEWED;
                } else {
                    newStatus = ContractStatus.IN_REVIEW;
                }
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

            // Returning updated contract and approval


            return { contract: updatedContract, approval };
        });

        // Notifications (Outside Transaction)
        try {
            const { contract: updatedContract, approval: updatedApproval } = result;

            // Notify Creator
            if (updatedContract.createdByUser?.email) {
                await this.emailService.sendApprovalResult(
                    updatedContract.createdByUser.email,
                    true,
                    updatedContract.title,
                    'Approver',
                    comment || (updatedContract.status === ContractStatus.APPROVED ? 'Fully approved' : `${updatedApproval.type} approved`),
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${updatedContract.id}`,
                );

                // Create In-App Notification
                await this.notificationsService.create({
                    userId: updatedContract.createdByUserId,
                    type: 'APPROVAL_COMPLETE',
                    title: `Contract ${updatedContract.status === ContractStatus.APPROVED ? 'Approved' : 'Updated'}`,
                    message: `${updatedContract.title} was ${updatedContract.status === ContractStatus.APPROVED ? 'fully approved' : `${updatedApproval.type} approved`}`,
                    link: `/dashboard/contracts/${updatedContract.id}`,
                });
            }
        } catch (error) {
            this.logger.error(`Failed to send approval notifications: ${(error as Error).message}`);
            // Don't throw, successful approval is more important
        }

        return result;
    }

    /**
     * Reject a contract
     */
    async reject(
        approvalId: string,
        actorId: string,
        organizationId: string,
        userPermissions: string[],
        comment: string,
    ) {
        if (!comment) {
            throw new ForbiddenException('Rejection comment is required');
        }

        const approval = await this.findApproval(approvalId, organizationId);

        // Security Check: Ensure user has permission for THIS specific approval type
        const requiredPermission = `approval:${approval.type.toLowerCase()}:act`;
        if (!userPermissions.includes(requiredPermission)) {
            throw new ForbiddenException(`You do not have permission to reject ${approval.type} requests`);
        }

        if (approval.status !== ApprovalStatus.PENDING) {
            throw new ForbiddenException('Approval has already been processed');
        }

        const result = await this.prisma.$transaction(async (tx) => {
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

            return { contract: updatedContract, approval };
        });

        // Notifications (Outside Transaction)
        try {
            const { contract: updatedContract, approval: updatedApproval } = result;

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
                    message: `${updatedContract.title} was rejected by ${updatedApproval.type}. Reason: ${comment}`,
                    link: `/dashboard/contracts/${updatedContract.id}`,
                });
            }
        } catch (error) {
            this.logger.error(`Failed to send rejection notifications: ${(error as Error).message}`);
        }

        return result;
    }

    /**
     * Request a revision on a contract (Soft Rejection / Change Request)
     */
    async requestRevision(
        approvalId: string,
        actorId: string,
        organizationId: string,
        userPermissions: string[],
        comment: string,
    ) {
        if (!comment) {
            throw new ForbiddenException('Revision comment is required');
        }

        const approval = await this.findApproval(approvalId, organizationId);

        // Security Check: Ensure user has permission for THIS specific approval type
        const requiredPermission = `approval:${approval.type.toLowerCase()}:act`;
        if (!userPermissions.includes(requiredPermission)) {
            throw new ForbiddenException(`You do not have permission to request changes for ${approval.type}`);
        }

        if (approval.status !== ApprovalStatus.PENDING) {
            throw new ForbiddenException('Approval has already been processed');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            // Update approval to REJECTED but with specific comment indicating revision
            // We use REJECTED as the approval status, but the Contract status will be distinct
            await tx.approval.update({
                where: { id: approvalId },
                data: {
                    status: ApprovalStatus.REJECTED,
                    actorId,
                    actedAt: new Date(),
                    comment: `REVISION REQUESTED: ${comment}`,
                },
            });

            // Update contract status to REVISION_REQUESTED
            const updatedContract = await tx.contract.update({
                where: { id: approval.contractId },
                data: { status: ContractStatus.REVISION_REQUESTED },
                include: { approvals: true, createdByUser: true },
            });

            this.logger.log(
                `Revision requested by ${approval.type} for contract ${approval.contractId}`,
            );

            return { contract: updatedContract, approval };
        });

        // Notifications (Outside Transaction)
        try {
            const { contract: updatedContract, approval: updatedApproval } = result;

            if (updatedContract.createdByUser?.email) {
                await this.emailService.sendApprovalResult(
                    updatedContract.createdByUser.email,
                    false, // Treated as rejection for email template purposes, or we could add a new template
                    updatedContract.title,
                    'Approver',
                    `Changes Requested: ${comment}`,
                    `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${updatedContract.id}`,
                );

                // Create In-App Notification
                await this.notificationsService.create({
                    userId: updatedContract.createdByUserId,
                    type: 'APPROVAL_REQUESTED_CHANGE',
                    title: 'Action Required: Revision Requested',
                    message: `${updatedApproval.type} requested changes on ${updatedContract.title}. Comment: ${comment}`,
                    link: `/dashboard/contracts/${updatedContract.id}`,
                });
            }
        } catch (error) {
            this.logger.error(`Failed to send revision notifications: ${(error as Error).message}`);
        }

        return result;
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
