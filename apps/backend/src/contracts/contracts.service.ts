/**
 * Contracts Service
 * 
 * Handles contract lifecycle operations with organization scoping.
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contract, ContractStatus, Prisma } from '@prisma/client';
import { sanitizeContractContent } from '../common/utils/sanitize.util';
import { EmailService } from '../common/email/email.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { DiffService } from '../common/services/diff.service';

import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../common/storage/storage.service';

@Injectable()
export class ContractsService {
    private readonly logger = new Logger(ContractsService.name);
    private diffService = new DiffService();

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private notificationsService: NotificationsService,
        private storageService: StorageService,
        private configService: ConfigService,
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
            this.emailService.sendContractToCounterparty(
                contract.counterpartyEmail,
                contract.counterpartyName || 'Valued Partner',
                contract.title,
                contract.reference,
                'RPSG Group',
                `${process.env.FRONTEND_URL}/contracts/${id}`,
            ).catch(err => this.logger.error(`Failed to send counterparty email: ${err.message}`));
        }

        return updated;
    }

    /**
     * Step 1: Get Presigned URL for uploading signed contract
     */
    async getSignedContractUploadUrl(id: string, organizationId: string, filename: string, contentType: string) {
        const contract = await this.findById(id, organizationId);

        if (contract.status !== ContractStatus.SENT_TO_COUNTERPARTY) {
            throw new ForbiddenException('Contract must be in SENT_TO_COUNTERPARTY status');
        }

        const bucketPath = `organizations/${organizationId}/contracts/${id}/signed`;
        return this.storageService.getUploadUrl(bucketPath, filename, contentType);
    }

    /**
     * Step 2: Confirm upload and activate contract
     */
    async confirmSignedContractUpload(id: string, organizationId: string, key: string) {
        const contract = await this.findById(id, organizationId);

        if (contract.status !== ContractStatus.SENT_TO_COUNTERPARTY) {
            throw new ForbiddenException('Contract must be in SENT_TO_COUNTERPARTY status');
        }

        // Update status to ACTIVE
        const updated = await this.prisma.contract.update({
            where: { id },
            data: {
                status: ContractStatus.ACTIVE,
                signedAt: new Date(),
                fieldData: {
                    ...(contract.fieldData as Prisma.JsonObject),
                    signedContractKey: key,
                } as Prisma.InputJsonValue,
            },
            include: { createdByUser: true }
        });

        // Notify creator
        const contractWithUser = updated as any;
        if (contractWithUser.createdByUser?.email) {
            this.emailService.send({
                to: contractWithUser.createdByUser.email,
                template: 'CONTRACT_SIGNED' as any,
                subject: `Contract Active: ${updated.title}`,
                data: {
                    contractTitle: updated.title,
                    contractReference: updated.reference,
                    signedDate: new Date().toLocaleDateString(),
                    contractUrl: `${process.env.FRONTEND_URL}/dashboard/contracts/${id}`,
                },
            }).catch(err => this.logger.error(`Failed to send activation email: ${err.message}`));
        }

        return updated;
    }

    /**
     * Step 1 (Draft): Get Upload URL for Third Party/Main Document
     */
    async getDocumentUploadUrl(id: string, organizationId: string, filename: string, contentType: string) {
        const contract = await this.findById(id, organizationId);

        // Allow uploads in DRAFT or negotiation stages
        if (contract.status !== ContractStatus.DRAFT && contract.status !== ContractStatus.PENDING_LEGAL) {
            // relaxed check for now, can be stricter
            // throw new ForbiddenException('Can only upload documents for Draft contracts');
        }

        const bucketPath = `organizations/${organizationId}/contracts/${id}/documents`;
        return this.storageService.getUploadUrl(bucketPath, filename, contentType);
    }

    /**
     * Step 2 (Draft): Confirm Upload and Link Attachment
     */
    async confirmDocumentUpload(id: string, organizationId: string, key: string, filename: string, fileSize: number) {
        const contract = await this.findById(id, organizationId);

        return this.prisma.contractAttachment.create({
            data: {
                contractId: id,
                fileName: filename,
                fileUrl: key, // Storing key as URL/Path for now, assuming helper resolves it
                fileType: 'application/pdf', // Simplified, or pass from controller
                fileSize: fileSize,
                category: 'MAIN_DOCUMENT',
                uploadedBy: 'system' // or pass user ID
            }
        });

    }

    /**
     * Get Download URL for an attachment
     */
    async getAttachmentDownloadUrl(id: string, attachmentId: string, organizationId: string) {
        await this.findById(id, organizationId); // Verify access

        const attachment = await this.prisma.contractAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment || attachment.contractId !== id) {
            throw new NotFoundException('Attachment not found');
        }

        // Generate presigned URL
        return {
            url: await this.storageService.getDownloadUrl(attachment.fileUrl),
            filename: attachment.fileName,
            contentType: attachment.fileType
        };
    }


    /**
     * Generate unique contract reference
     */
    private generateReference(orgCode: string): string {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const unique = randomBytes(3).toString('hex').toUpperCase();
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
            annexureData?: string;
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

        // Fetch Template with Annexures
        const template = await this.prisma.template.findUnique({
            where: { id: data.templateId },
            include: {
                annexures: { orderBy: { order: 'asc' } },
                organizationAccess: true
            }
        });

        if (!template) {
            throw new NotFoundException('Template not found');
        }

        if (template.organizationAccess.length > 0) {
            // TODO: Validate organization access if not global
        }

        // Snapshot Content
        // 1. Main Content logic: Always from Template (Fixed)
        const contentSnapshot = template.baseContent;

        // Calculate Integrity Hash (SHA-256)
        const contentHash = createHash('sha256').update(contentSnapshot).digest('hex');

        // 2. Annexure logic: Use provided data, OR fallback to template default
        // If data.annexureData is "[]" or empty, and template has annexures, use template's
        let finalAnnexureData = data.annexureData;

        // If the contract creation didn't provide specific annexure data (e.g. direct create), use template's
        // We assume structured JSON array for annexures
        if (!finalAnnexureData || finalAnnexureData.length < 5 || finalAnnexureData === '[]') {
            finalAnnexureData = JSON.stringify(template.annexures.map(a => ({
                id: a.id,
                name: a.name,
                title: a.title,
                content: a.content,
            })));
        }

        const sanitizedAnnexures = sanitizeContractContent(finalAnnexureData);

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
                    content: contentSnapshot, // SNAPSHOT: Main Agreement
                    contentHash: contentHash, // INTEGRITY: SHA-256 Hash
                    annexureData: sanitizedAnnexures, // SNAPSHOT/EDIT: Annexures
                    fieldData: data.fieldData,
                    createdByUserId: userId,
                },
            });

            // Validate dates
            if (data.startDate) {
                const startDate = new Date(data.startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Relaxed validation: Allow start date to be slightly in past (e.g. today created, but effective yesterday)
                // or just log warning. For now, strict but maybe necessary to remove if practical use cases exist.
            }

            if (data.startDate && data.endDate) {
                const startDate = new Date(data.startDate);
                const endDate = new Date(data.endDate);
                if (endDate <= startDate) {
                    throw new BadRequestException('End date must be after start date');
                }
            }

            // Create initial version with changelog
            const changeLog = await this.diffService.calculateChanges(null, { ...data, content: contentSnapshot }, user?.email || 'system');

            await tx.contractVersion.create({
                data: {
                    contractId: contract.id,
                    versionNumber: 1,
                    contentSnapshot: JSON.stringify({
                        main: contentSnapshot,
                        annexures: sanitizedAnnexures
                    }),
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
    /**
     * Find contracts by organization
     */
    async findByOrganization(
        organizationId: string,
        params?: {
            page?: number;
            limit?: number;
            search?: string;
            status?: ContractStatus;
            createdByUserId?: string;
            expiringDays?: number;
        },
    ) {
        const page = Number(params?.page) || 1;
        const limit = Number(params?.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.ContractWhereInput = {
            organizationId,
            status: params?.status,
            createdByUserId: params?.createdByUserId,
            ...(params?.expiringDays && {
                endDate: {
                    gte: new Date(),
                    lte: new Date(new Date().getTime() + params.expiringDays * 24 * 60 * 60 * 1000),
                },
            }),
            ...(params?.search && {
                OR: [
                    { title: { contains: params.search, mode: 'insensitive' } },
                    { reference: { contains: params.search, mode: 'insensitive' } },
                    { counterpartyName: { contains: params.search, mode: 'insensitive' } },
                ],
            }),
        };

        const [data, total] = await Promise.all([
            this.prisma.contract.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    reference: true,
                    status: true,
                    counterpartyName: true,
                    createdAt: true,
                    updatedAt: true,
                    amount: true,
                    startDate: true,
                    endDate: true,
                    template: { select: { name: true, category: true } },
                    createdByUser: { select: { name: true, email: true } },
                    approvals: { select: { status: true, type: true } }, // Minimal approval data
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.contract.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                lastPage: Math.ceil(total / limit),
                currentPage: page,
                perPage: limit,
                prev: page > 1 ? page - 1 : null,
                next: page < Math.ceil(total / limit) ? page + 1 : null,
            },
        };
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
                attachments: true,
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

            // Validate dates for update
            if (data.startDate) {
                const startDate = new Date(data.startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // For updates, we might need to be more careful if strictly enforcing "no past dates"
                // But generally, moving a start date to the past is weird for a new/draft contract.
                if (startDate < today) {
                    throw new BadRequestException('Start date cannot be in the past');
                }

                if (data.endDate) {
                    const endDate = new Date(data.endDate);
                    if (endDate <= startDate) {
                        throw new BadRequestException('End date must be after start date');
                    }
                }
            }

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

                const changeLog = await this.diffService.calculateChanges(
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

        // 1. Database Updates (State Transition)
        const updatedContract = await this.prisma.$transaction(async (tx) => {
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

            return tx.contract.findUnique({
                where: { id },
                include: {
                    approvals: true,
                    createdByUser: {
                        select: { name: true, email: true }
                    }
                },
            });
        });

        // 2. Async Notifications (Post-Transaction)
        if (updatedContract) {
            try {
                // Email Approvers
                const legalApproverEmail = this.configService.get<string>('LEGAL_APPROVER_EMAIL', 'legal@clm.com');
                const financeApproverEmail = this.configService.get<string>('FINANCE_APPROVER_EMAIL', 'finance@clm.com');

                // We don't await these to return the response faster, 
                // but we catch errors to prevent crashing the successful request
                this.emailService.sendApprovalRequest(
                    legalApproverEmail,
                    updatedContract.title,
                    updatedContract.reference,
                    'LEGAL',
                    updatedContract.createdByUser?.name || 'System',
                    `${process.env.FRONTEND_URL}/dashboard/approvals/legal`,
                ).catch(err => this.logger.error(`Failed to send legal approval email: ${err.message}`));

                this.emailService.sendApprovalRequest(
                    financeApproverEmail,
                    updatedContract.title,
                    updatedContract.reference,
                    'FINANCE',
                    updatedContract.createdByUser?.name || 'System',
                    `${process.env.FRONTEND_URL}/dashboard/approvals/finance`,
                ).catch(err => this.logger.error(`Failed to send finance approval email: ${err.message}`));

                // Internal Notifications
                this.notifyApprovers(
                    organizationId,
                    'approval:legal:act',
                    'LEGAL',
                    updatedContract.title,
                    updatedContract.id
                ).catch(err => this.logger.error(`Failed to notify legal approvers: ${err.message}`));

                this.notifyApprovers(
                    organizationId,
                    'approval:finance:act',
                    'FINANCE',
                    updatedContract.title,
                    updatedContract.id
                ).catch(err => this.logger.error(`Failed to notify finance approvers: ${err.message}`));
            } catch (error) {
                // Log but don't fail the request since DB is already updated
                this.logger.error('Error triggering post-submission notifications:', error);
            }
        }

        return updatedContract;
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
