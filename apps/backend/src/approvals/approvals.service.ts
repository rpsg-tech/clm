/**
 * Approvals Service
 * 
 * Handles parallel Legal/Finance approval workflow.
 */

import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus, ApprovalType, ContractStatus } from '@prisma/client';

import { EmailService, EmailTemplate } from '../common/email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ApprovalsService {
    private readonly logger = new Logger(ApprovalsService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private notificationsService: NotificationsService,
        private analyticsService: AnalyticsService,
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
            // REVISED LOGIC: STRICT CHECK
            // 1. If Legal is PENDING -> SENT_TO_LEGAL (Priority)
            // 2. If Finance is PENDING -> FINANCE_REVIEW_IN_PROGRESS
            // 3. If ALL Approved -> APPROVED

            let newStatus: ContractStatus;

            const legal = allApprovals.find(a => a.type === 'LEGAL');
            const finance = allApprovals.find(a => a.type === 'FINANCE');

            // Helper to check status (considering the update currently happening in tx)
            const getStatus = (a: any) => (a.id === approvalId ? ApprovalStatus.APPROVED : a.status);

            const isLegalPending = legal && getStatus(legal) === ApprovalStatus.PENDING;
            const isFinancePending = finance && getStatus(finance) === ApprovalStatus.PENDING;

            if (isLegalPending) {
                newStatus = ContractStatus.SENT_TO_LEGAL;
            } else if (isFinancePending) {
                newStatus = ContractStatus.FINANCE_REVIEW_IN_PROGRESS;
            } else {
                // No pending reviews?
                if (isFullyApproved) {
                    newStatus = ContractStatus.APPROVED;
                } else {
                    // Fallback, though logic above covers most cases
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

        // [Cache Invalidation] Ensure dashboard reflects new status immediately
        await this.analyticsService.invalidateOrganizationCache(organizationId);


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

        // Security Check: REJECTION NOW REQUIRES SPECIAL PERMISSION
        // Old: approval:${type}:act
        // New: approval:reject
        if (!userPermissions.includes('approval:reject')) {
            throw new ForbiddenException(`You do not have permission to REJECT contracts. Please request changes instead.`);
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

        // [Cache Invalidation] Ensure dashboard reflects new status immediately
        await this.analyticsService.invalidateOrganizationCache(organizationId);


        return result;
    }

    /**
     * Return contract to Manager (De-escalate)
     * For Legal Head usage
     */
    async returnToManager(
        approvalId: string,
        actorId: string,
        organizationId: string,
        userPermissions: string[],
        comment: string,
    ) {
        if (!comment) throw new ForbiddenException('Comment is required for returning contract');

        // 1. Permission Check (Implicitly Legal Head if acting on escalated ticket, but verify)
        // We can reuse 'approval:legal:act' or check role.
        // Assuming Legal Head has 'approval:legal:act'.

        const approval = await this.findApproval(approvalId, organizationId);

        // Ensure it is escalated
        if (approval.status !== ApprovalStatus.PENDING) {
            throw new ForbiddenException('Approval has already been processed');
        }

        // 2. Transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Reset approval to be assigned back to original escalator or open
            const originalEscalator = approval.escalatedBy;

            // We keep the same approval record but change actor? 
            // Or better, mark this one as RETURNED (if enum exists) -> No enum.
            // We will reset it to PENDING and assign actorId back to escalator (or null).

            await tx.approval.update({
                where: { id: approvalId },
                data: {
                    status: ApprovalStatus.PENDING,
                    actorId: originalEscalator, // Assign back to manager
                    escalatedTo: null, // Clear escalation
                    // Append comment to history or replace? 
                    // We'll prepend "RETURNED BY HEAD: " to comment
                    comment: `RETURNED BY HEAD: ${comment}`,
                }
            });

            // Update Contract Status
            const updatedContract = await tx.contract.update({
                where: { id: approval.contractId },
                data: { status: ContractStatus.SENT_TO_LEGAL }, // Back to Manager Queue
                include: { createdByUser: true }
            });

            return { contract: updatedContract, approval };
        });

        // Notifications
        try {
            // Notify the Manager (escalatedBy)
            if (approval.escalatedBy) {
                await this.notificationsService.create({
                    userId: approval.escalatedBy,
                    type: 'APPROVAL_REQUEST',
                    title: 'Contract Returned by Legal Head',
                    message: `Legal Head returned ${result.contract.title} to you. Comment: ${comment}`,
                    link: `/dashboard/contracts/${result.contract.id}`
                });
            }
        } catch (e) {
            this.logger.error(e);
        }

        await this.analyticsService.invalidateOrganizationCache(organizationId);
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

        // [Cache Invalidation] Ensure dashboard reflects new status immediately
        await this.analyticsService.invalidateOrganizationCache(organizationId);


        return result;
    }

    /**
     * Escalate contract to Legal Head
     * Only Legal Managers with contract:escalate permission can do this
     */
    async escalateToLegalHead(
        contractId: string,
        userId: string,
        organizationId: string,
        userPermissions: string[],
        reason?: string,
    ) {
        // 1. Permission check
        if (!userPermissions.includes('contract:escalate')) {
            throw new ForbiddenException('Only Legal Managers can escalate to Legal Head');
        }

        // 2. Get contract and verify status
        const contract = await this.prisma.contract.findFirst({
            where: { id: contractId, organizationId },
            include: {
                createdByUser: true,
                approvals: true,
            },
        });

        if (!contract) {
            throw new NotFoundException('Contract not found');
        }

        const legalApproval = contract.approvals?.find(a => a.type === 'LEGAL');

        // Allow escalation if Legal is specifically pending, regardless of aggregate status (Parallel Negotiation)
        const isLegalPending = legalApproval?.status === ApprovalStatus.PENDING;

        if (!isLegalPending) {
            throw new ForbiddenException(
                'No pending Legal approval found to escalate'
            );
        }

        // 3. Get Legal Head user
        const legalHeadRole = await this.prisma.role.findFirst({
            where: { code: 'LEGAL_HEAD' },
            include: {
                userRoles: {
                    where: {
                        organizationId,
                        user: { isActive: true },
                    },
                    include: { user: true },
                },
            },
        });

        if (!legalHeadRole || legalHeadRole.userRoles.length === 0) {
            throw new NotFoundException(
                'No active Legal Head found in organization. Please assign a Legal Head role first.'
            );
        }

        const legalHead = legalHeadRole.userRoles[0].user;

        // 4. Get escalating user details
        const escalatingUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        // 5. Transaction: Update contract and create approval record
        const result = await this.prisma.$transaction(async (tx) => {
            // Update contract status
            const updatedContract = await tx.contract.update({
                where: { id: contractId },
                data: { status: ContractStatus.PENDING_LEGAL_HEAD },
            });

            // Create or update approval record for Legal Head
            const approval = await tx.approval.upsert({
                where: {
                    contractId_type: {
                        contractId,
                        type: ApprovalType.LEGAL,
                    },
                },
                update: {
                    actorId: legalHead.id,
                    status: ApprovalStatus.PENDING,
                    comment: reason || 'Escalated for Legal Head review',
                    escalatedBy: userId,
                    escalatedAt: new Date(),
                    escalatedTo: legalHead.id,
                },
                create: {
                    contractId,
                    actorId: legalHead.id,
                    type: ApprovalType.LEGAL,
                    status: ApprovalStatus.PENDING,
                    comment: reason || 'Escalated for Legal Head review',
                    escalatedBy: userId,
                    escalatedAt: new Date(),
                    escalatedTo: legalHead.id,
                },
            });

            this.logger.log(
                `Contract ${contractId} escalated to Legal Head by user ${userId}. Reason: ${reason || 'N/A'}`
            );

            return { contract: updatedContract, approval, legalHead };
        });

        // 6. Send notifications (outside transaction)
        try {
            // Notify Legal Head
            await this.notificationsService.create({
                userId: legalHead.id,
                type: 'APPROVAL_REQUEST',
                title: 'Contract Escalated for Your Review',
                message: `${escalatingUser?.name || 'Legal Manager'} escalated contract "${contract.title}" for your approval.${reason ? ` Reason: ${reason}` : ''}`,
                link: `/dashboard/contracts/${contractId}`,
            });

            // Send email to Legal Head
            if (legalHead.email) {
                await this.emailService.send({
                    to: legalHead.email,
                    template: EmailTemplate.APPROVAL_REQUIRED,
                    subject: `🔔 Contract Escalated: ${contract.title}`,
                    data: {
                        contractTitle: contract.title,
                        contractReference: contract.id,
                        approvalType: 'Legal Head Review',
                        requestedBy: escalatingUser?.name || 'Legal Manager',
                        approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${contractId}`,
                    },
                    priority: 'high',
                });
            }

            // Notify contract creator
            if (contract.createdByUser?.id) {
                await this.notificationsService.create({
                    userId: contract.createdByUser.id,
                    type: 'CONTRACT_STATUS_CHANGED',
                    title: 'Contract Escalated to Legal Head',
                    message: `Your contract "${contract.title}" has been escalated to Legal Head for final approval.`,
                    link: `/dashboard/contracts/${contractId}`,
                });
            }
        } catch (error) {
            this.logger.error(`Failed to send escalation notifications: ${(error as Error).message}`);
        }

        // [Cache Invalidation] Ensure dashboard reflects new status immediately
        await this.analyticsService.invalidateOrganizationCache(organizationId);


        return result.contract;
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
