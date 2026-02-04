import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../common/email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Handles all contract-related notifications (email + in-app)
 * Extracted from ContractsService for Single Responsibility Principle
 */
@Injectable()
export class ContractNotificationService {
    private readonly logger = new Logger(ContractNotificationService.name);

    constructor(
        private emailService: EmailService,
        private notificationsService: NotificationsService,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    /**
     * Notify approvers when contract is submitted
     */
    async notifyApprovalRequest(
        organizationId: string,
        contractId: string,
        contractTitle: string,
        contractReference: string,
        submitterName: string,
        approvalType: 'LEGAL' | 'FINANCE'
    ) {
        try {
            const approverEmail = this.configService.get<string>(
                approvalType === 'LEGAL' ? 'LEGAL_APPROVER_EMAIL' : 'FINANCE_APPROVER_EMAIL',
                approvalType === 'LEGAL' ? 'legal@clm.com' : 'finance@clm.com'
            );

            const actionUrl = `${this.configService.get('FRONTEND_URL')}/dashboard/approvals/${approvalType.toLowerCase()}`;

            // Send email
            await this.emailService.sendApprovalRequest(
                approverEmail,
                contractTitle,
                contractReference,
                approvalType,
                submitterName,
                actionUrl,
            );

            // Send in-app notifications
            await this.notifyApprovers(
                organizationId,
                `approval:${approvalType.toLowerCase()}:act`,
                approvalType,
                contractTitle,
                contractId
            );

            this.logger.log(`Sent ${approvalType} approval notifications for contract ${contractId}`);
        } catch (error) {
            this.logger.error(`Failed to send approval notifications for ${contractId}:`, error);
            throw error;
        }
    }

    /**
     * Notify creator when revision is requested
     */
    async notifyRevisionRequest(
        creatorUserId: string,
        contractTitle: string,
        contractId: string,
        requesterName: string,
        comment: string,
    ) {
        try {
            const creator = await this.prisma.user.findUnique({
                where: { id: creatorUserId },
                select: { email: true }
            });

            if (!creator?.email) {
                this.logger.warn(`No email found for user ${creatorUserId}`);
                return;
            }

            const contractUrl = `${this.configService.get('FRONTEND_URL')}/dashboard/contracts/${contractId}/edit`;

            // Send email using generic send method
            await this.emailService.send({
                to: creator.email,
                template: 'REVISION_REQUESTED' as any,
                subject: `✏️ Revision Requested: ${contractTitle}`,
                data: {
                    contractTitle,
                    requestedBy: requesterName,
                    comment,
                    contractUrl,
                },
                priority: 'high',
            });

            // In-app notification
            await this.notificationsService.create({
                userId: creatorUserId,
                type: 'REVISION_REQUESTED',
                title: 'Revision Requested',
                message: `${requesterName} requested changes: ${comment}`,
                link: `/dashboard/contracts/${contractId}/edit`,
            });

            this.logger.log(`Notified creator ${creatorUserId} of revision request`);
        } catch (error) {
            this.logger.error(`Failed to send revision request notification:`, error);
        }
    }

    /**
     * Notify counterparty when contract is sent
     */
    async notifyCounterparty(
        counterpartyEmail: string,
        counterpartyName: string,
        contractTitle: string,
        contractReference: string,
        companyName: string,
        reviewUrl: string,
    ) {
        try {
            await this.emailService.sendContractToCounterparty(
                counterpartyEmail,
                counterpartyName,
                contractTitle,
                contractReference,
                companyName,
                reviewUrl,
            );

            this.logger.log(`Sent contract ${contractReference} to counterparty ${counterpartyEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send contract to counterparty:`, error);
        }
    }

    /**
     * Notify creator when contract becomes active
     */
    async notifyContractActivated(
        creatorEmail: string,
        contractTitle: string,
        contractReference: string,
        contractId: string,
    ) {
        try {
            const contractUrl = `${this.configService.get('FRONTEND_URL')}/dashboard/contracts/${contractId}`;

            await this.emailService.send({
                to: creatorEmail,
                template: 'CONTRACT_SIGNED' as any,
                subject: `Contract Fully Executed: ${contractTitle}`,
                data: {
                    contractTitle,
                    contractReference,
                    signedDate: new Date().toLocaleDateString(),
                    contractUrl,
                },
                priority: 'normal',
            });

            this.logger.log(`Notified creator of contract activation: ${contractReference}`);
        } catch (error) {
            this.logger.error(`Failed to send contract activation notification:`, error);
        }
    }

    /**
     * Helper: Notify all users with specific permission
     */
    private async notifyApprovers(
        organizationId: string,
        permissionCode: string,
        approvalType: string,
        contractTitle: string,
        contractId: string,
    ) {
        const users = await this.prisma.user.findMany({
            where: {
                organizationRoles: {
                    some: {
                        organizationId,
                        role: {
                            permissions: {
                                some: {
                                    permission: { code: permissionCode },
                                },
                            },
                        },
                    },
                },
                isActive: true,
            },
            select: { id: true },
        });

        await Promise.all(users.map(user =>
            this.notificationsService.create({
                userId: user.id,
                type: 'APPROVAL_REQUEST',
                title: `${approvalType} Approval Required`,
                message: `${contractTitle} requires your review and approval.`,
                link: `/dashboard/approvals/${approvalType.toLowerCase()}`,
            })
        ));
    }
}
