/**
 * Contracts Service
 * 
 * Handles contract lifecycle operations with organization scoping.
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contract, ContractStatus, Prisma } from '@prisma/client';
import { sanitizeContractContent } from '../common/utils/sanitize.util';
import { EmailService } from '../common/email/email.service';
import { nanoid } from 'nanoid';
import { DiffService } from '../common/services/diff.service';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContractsService {
    private diffService = new DiffService();

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private notificationsService: NotificationsService,
    ) { }

    // ... (existing methods until sendToCounterparty)

    /**
     * Send contract to counterparty
     */
    async sendToCounterparty(id: string, organizationId: string) {
        const contract = await this.findById(id, organizationId);

        // Can only send if status is APPROVED
        if (contract.status !== ContractStatus.APPROVED) {
            throw new ForbiddenException('Only APPROVED contracts can be sent to counterparty');
        }

        // Update status
        const updated = await this.prisma.contract.update({
            where: { id },
            data: {
                status: ContractStatus.SENT_TO_COUNTERPARTY,
                sentAt: new Date(),
            },
        });

        // Send email
        if (contract.counterpartyEmail) {
            await this.emailService.sendContractToCounterparty(
                contract.counterpartyEmail,
                contract.counterpartyName || 'Valued Partner',
                contract.title,
                contract.reference,
                'RPSG Group',
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contracts/${id}`,
            );
        }

        return updated;
    }

    /**
     * Upload signed contract (simulated)
     */
    async uploadSignedContract(id: string, organizationId: string, filename: string) {
        const contract = await this.findById(id, organizationId);

        // Can only upload if status is SENT_TO_COUNTERPARTY
        if (contract.status !== ContractStatus.SENT_TO_COUNTERPARTY) {
            throw new ForbiddenException('Contract must be in SENT_TO_COUNTERPARTY status');
        }

        // Update status to ACTIVE
        const updated = await this.prisma.contract.update({
            where: { id },
            data: {
                status: ContractStatus.ACTIVE,
                signedAt: new Date(),
            },
        });

        // Notify creator
        if (contract.createdByUser?.email) {
            await this.emailService.send({
                to: contract.createdByUser.email,
                template: 'CONTRACT_SIGNED' as any,
                subject: `Contract Active: ${contract.title}`,
                data: {
                    contractTitle: contract.title,
                    contractReference: contract.reference,
                    signedDate: new Date().toLocaleDateString(),
                    contractUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${id}`,
                },
            });
        }

        return updated;
    }

    /**
     * Generate unique contract reference
     */
    private generateReference(orgCode: string): string {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const unique = nanoid(6).toUpperCase();
        return `${orgCode}-${year}${month}-${unique}`;
    }

    /**
     * Create a new contract (always within organization context)
     */
    async create(
        organizationId: string,
        userId: string,
        data: {
            templateId: string;
            title: string;
            counterpartyName?: string;
            counterpartyEmail?: string;
            startDate?: string;
            endDate?: string;
            amount?: number;
            description?: string;
            annexureData: string;
            fieldData: Prisma.InputJsonValue;
        },
    ): Promise<Contract> {
        // Get org code for reference generation
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { code: true },
        });

        if (!org) {
            throw new NotFoundException('Organization not found');
        }

        // Get user for changelog
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        // Create contract with initial version in a transaction
        return this.prisma.$transaction(async (tx) => {
            const contract = await tx.contract.create({
                data: {
                    organizationId,
                    templateId: data.templateId,
                    title: data.title,
                    reference: this.generateReference(org.code),
                    counterpartyName: data.counterpartyName,
                    counterpartyEmail: data.counterpartyEmail,
                    startDate: data.startDate ? new Date(data.startDate) : undefined,
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    amount: data.amount,
                    description: data.description,
                    annexureData: sanitizeContractContent(data.annexureData),
                    fieldData: data.fieldData,
                    createdByUserId: userId,
                },
            });

            // Create initial version with changelog
            const changeLog = this.diffService.calculateChanges(null, data, user?.email || 'system');

            await tx.contractVersion.create({
                data: {
                    contractId: contract.id,
                    versionNumber: 1,
                    contentSnapshot: sanitizeContractContent(data.annexureData),
                    changeLog: changeLog as any,
                    createdByUserId: userId,
                },
            });

            return contract;
        });
    }

    /**
     * Find contracts by organization
     */
    async findByOrganization(
        organizationId: string,
        params?: {
            status?: ContractStatus;
            createdByUserId?: string;
            skip?: number;
            take?: number;
        },
    ) {
        const [contracts, total] = await Promise.all([
            this.prisma.contract.findMany({
                where: {
                    organizationId,
                    status: params?.status,
                    createdByUserId: params?.createdByUserId,
                },
                include: {
                    template: { select: { name: true, category: true } },
                    createdByUser: { select: { name: true, email: true } },
                    approvals: true,
                },
                orderBy: { createdAt: 'desc' },
                skip: params?.skip,
                take: params?.take,
            }),
            this.prisma.contract.count({
                where: {
                    organizationId,
                    status: params?.status,
                    createdByUserId: params?.createdByUserId,
                },
            }),
        ]);

        return { contracts, total };
    }

    /**
     * Find contract by ID (with org scoping)
     */
    async findById(id: string, organizationId: string) {
        const contract = await this.prisma.contract.findUnique({
            where: { id },
            include: {
                template: true,
                createdByUser: { select: { id: true, name: true, email: true } },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 5,
                },
                approvals: {
                    include: {
                        actor: { select: { name: true, email: true } },
                    },
                },
            },
        });

        if (!contract) {
            throw new NotFoundException('Contract not found');
        }

        // Organization scoping - critical security check
        if (contract.organizationId !== organizationId) {
            throw new ForbiddenException('Access denied to this contract');
        }

        // Manually populate createdBy for versions since there is no relation in schema
        const userIds = [...new Set(contract.versions.map(v => v.createdByUserId))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        return {
            ...contract,
            versions: contract.versions.map(v => ({
                ...v,
                createdBy: userMap.get(v.createdByUserId) || { name: 'System', email: '' }
            }))
        };
    }

    /**
     * Update contract (creates new version)
     */
    async update(
        id: string,
        organizationId: string,
        userId: string,
        data: {
            title?: string;
            annexureData?: string;
            fieldData?: Prisma.InputJsonValue;
            counterpartyName?: string;
            counterpartyEmail?: string;
            startDate?: string;
            endDate?: string;
            amount?: number;
        },
    ) {
        const contract = await this.findById(id, organizationId);

        // Can only update DRAFT contracts
        if (contract.status !== ContractStatus.DRAFT) {
            throw new ForbiddenException('Can only update contracts in DRAFT status');
        }

        // Get user for changelog
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        return this.prisma.$transaction(async (tx) => {
            // Get latest version number
            const latestVersion = await tx.contractVersion.findFirst({
                where: { contractId: id },
                orderBy: { versionNumber: 'desc' },
            });

            const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

            // Update contract
            const sanitizedContent = data.annexureData
                ? sanitizeContractContent(data.annexureData)
                : undefined;

            const updated = await tx.contract.update({
                where: { id },
                data: {
                    title: data.title,
                    annexureData: sanitizedContent,
                    fieldData: data.fieldData,
                    counterpartyName: data.counterpartyName,
                    counterpartyEmail: data.counterpartyEmail,
                    startDate: data.startDate ? new Date(data.startDate) : undefined,
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    amount: data.amount,
                },
            });

            // Create new version with changelog if content changed
            if (sanitizedContent) {
                const previousData = {
                    title: contract.title,
                    counterpartyName: contract.counterpartyName,
                    counterpartyEmail: contract.counterpartyEmail,
                    annexureData: contract.annexureData,
                };

                const newData = {
                    ...previousData,
                    ...data,
                    annexureData: sanitizedContent,
                };

                const changeLog = this.diffService.calculateChanges(
                    previousData,
                    newData,
                    user?.email || 'system',
                );

                await tx.contractVersion.create({
                    data: {
                        contractId: id,
                        versionNumber: newVersionNumber,
                        contentSnapshot: sanitizedContent,
                        changeLog: changeLog as any,
                        createdByUserId: userId,
                    },
                });
            }

            return updated;
        });
    }

    /**
     * Submit contract for approval
     */
    async submitForApproval(id: string, organizationId: string) {
        const contract = await this.findById(id, organizationId);

        if (contract.status !== ContractStatus.DRAFT) {
            throw new ForbiddenException('Can only submit DRAFT contracts');
        }

        // Update status and create approval records
        return this.prisma.$transaction(async (tx) => {
            await tx.contract.update({
                where: { id },
                data: {
                    status: ContractStatus.PENDING_LEGAL,
                    submittedAt: new Date(),
                },
            });

            // Create parallel approval records for Legal and Finance
            await tx.approval.createMany({
                data: [
                    { contractId: id, type: 'LEGAL' },
                    { contractId: id, type: 'FINANCE' },
                ],
            });

            // Notify Approvers
            await this.emailService.sendApprovalRequest(
                'legal@clm.com',
                contract.title,
                contract.reference,
                'LEGAL',
                contract.createdByUser?.name || 'System',
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/approvals/legal`,
            );

            await this.emailService.sendApprovalRequest(
                'finance@clm.com',
                contract.title,
                contract.reference,
                'FINANCE',
                contract.createdByUser?.name || 'System',
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/approvals/finance`,
            );

            // Notify Legal Approvers
            await this.notifyApprovers(
                organizationId,
                'approval:legal:act',
                'LEGAL',
                contract.title,
                contract.id
            );

            // Notify Finance Approvers
            await this.notifyApprovers(
                organizationId,
                'approval:finance:act',
                'FINANCE',
                contract.title,
                contract.id
            );

            return tx.contract.findUnique({
                where: { id },
                include: { approvals: true },
            });
        });
    }

    /**
     * Helper to notify all users with specific permission
     */
    private async notifyApprovers(
        organizationId: string,
        permissionCode: string,
        roleName: string,
        contractTitle: string,
        contractId: string,
    ) {
        // Find all users in org who have roles containing this permission
        const users = await this.prisma.user.findMany({
            where: {
                organizationRoles: {
                    some: {
                        organizationId,
                        role: {
                            permissions: {
                                some: {
                                    permission: {
                                        code: permissionCode,
                                    },
                                },
                            },
                        },
                    },
                },
                isActive: true,
            },
            select: { id: true },
        });

        // Send notification to each approver
        await Promise.all(users.map(user =>
            this.notificationsService.create({
                userId: user.id,
                type: 'APPROVAL_REQUEST',
                title: `${roleName} Approval Required`,
                message: `${contractTitle} requires your review and approval.`,
                link: `/dashboard/approvals/${roleName.toLowerCase()}`,
            })
        ));
    }

    /**
     * Get contract versions with changelog summary
     */
    async getVersions(id: string, organizationId: string) {
        await this.findById(id, organizationId); // Verify access

        const versions = await this.prisma.contractVersion.findMany({
            where: { contractId: id },
            orderBy: { versionNumber: 'desc' },
        });

        // Get user info for each version
        const userIds = [...new Set(versions.map(v => v.createdByUserId))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
        });

        const userMap = new Map(users.map(u => [u.id, u]));

        return versions.map((v) => {
            const user = userMap.get(v.createdByUserId);
            return {
                id: v.id,
                version: v.versionNumber,
                createdAt: v.createdAt,
                createdBy: {
                    name: user?.name || 'Unknown',
                    email: user?.email || '',
                },
                changeLog: v.changeLog as any,
            };
        });
    }

    /**
     * Get detailed changelog for a specific version
     */
    async getVersionChangelog(id: string, versionId: string, organizationId: string) {
        await this.findById(id, organizationId); // Verify access

        const version = await this.prisma.contractVersion.findUnique({
            where: { id: versionId },
        });

        if (!version || version.contractId !== id) {
            throw new NotFoundException('Version not found');
        }

        // Get user info
        const user = await this.prisma.user.findUnique({
            where: { id: version.createdByUserId },
            select: { name: true, email: true },
        });

        // Get previous version for context
        const previousVersion = await this.prisma.contractVersion.findFirst({
            where: {
                contractId: id,
                versionNumber: { lt: version.versionNumber },
            },
            orderBy: { versionNumber: 'desc' },
        });

        return {
            version: version.versionNumber,
            previousVersion: previousVersion?.versionNumber || null,
            changeLog: version.changeLog as any,
            createdBy: {
                name: user?.name || 'Unknown',
                email: user?.email || '',
            },
            createdAt: version.createdAt,
        };
    }

    /**
     * Compare two contract versions
     */
    async compareVersions(
        id: string,
        fromVersionId: string,
        toVersionId: string,
        organizationId: string,
    ) {
        await this.findById(id, organizationId); // Verify access

        const [fromVersion, toVersion] = await Promise.all([
            this.prisma.contractVersion.findUnique({
                where: { id: fromVersionId },
            }),
            this.prisma.contractVersion.findUnique({
                where: { id: toVersionId },
            }),
        ]);

        if (!fromVersion || !toVersion || fromVersion.contractId !== id || toVersion.contractId !== id) {
            throw new NotFoundException('Version not found');
        }

        // Get user info
        const [fromUser, toUser] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: fromVersion.createdByUserId },
                select: { name: true, email: true },
            }),
            this.prisma.user.findUnique({
                where: { id: toVersion.createdByUserId },
                select: { name: true, email: true },
            }),
        ]);

        // Get contract  for field data
        const contract = await this.prisma.contract.findUnique({
            where: { id },
        });

        // Create comparison data
        const fromData = {
            ...contract,
            content: fromVersion.contentSnapshot,
            annexureData: fromVersion.contentSnapshot,
        };

        const toData = {
            ...contract,
            content: toVersion.contentSnapshot,
            annexureData: toVersion.contentSnapshot,
        };

        const comparison = this.diffService.compareVersions(fromData, toData);

        return {
            fromVersion: {
                id: fromVersion.id,
                version: fromVersion.versionNumber,
                createdAt: fromVersion.createdAt,
                createdBy: {
                    name: fromUser?.name || 'Unknown',
                    email: fromUser?.email || '',
                },
            },
            toVersion: {
                id: toVersion.id,
                version: toVersion.versionNumber,
                createdAt: toVersion.createdAt,
                createdBy: {
                    name: toUser?.name || 'Unknown',
                    email: toUser?.email || '',
                },
            },
            ...comparison,
        };
    }
}
