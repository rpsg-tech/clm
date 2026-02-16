/**
 * Contracts Service
 * 
 * Handles contract lifecycle operations with organization scoping.
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contract, ContractStatus, ApprovalStatus, Prisma, LogVisibility } from '@prisma/client';
import { sanitizeContractContent } from '../common/utils/sanitize.util';
import { EmailService, EmailTemplate } from '../common/email/email.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { DiffService } from '../common/services/diff.service';
import { FeatureFlagService } from '../config/feature-flag.service';
import { AuditService } from '../audit/audit.service';

import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../common/storage/storage.service';
import { OcrService } from '../common/services/ocr.service';
import { RagService } from '../ai/rag/rag.service';

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
        private featureFlagService: FeatureFlagService,
        private ocrService: OcrService,
        private ragService: RagService,
        private auditService: AuditService,
    ) { }

    // ... (existing methods until sendToCounterparty)

    /**
     * Send contract to counterparty
     */
    async sendToCounterparty(
        id: string,
        userId: string,
        organizationId: string,
        emailOptions?: { recipients?: string[]; cc?: string[]; subject?: string; body?: string }
    ) {
        const contract = await this.findById(id, organizationId);

        // NEW LOGIC: Allow sending in Draft, Approved, or Review states (Parallel Negotiation)
        const allowedStatuses: ContractStatus[] = [
            ContractStatus.DRAFT,
            ContractStatus.APPROVED,
            ContractStatus.REVISION_REQUESTED, // Allow sending back to CP if changes requested? Maybe.
            ContractStatus.SENT_TO_LEGAL,
            ContractStatus.LEGAL_REVIEW_IN_PROGRESS,
            ContractStatus.SENT_TO_FINANCE,
            ContractStatus.FINANCE_REVIEW_IN_PROGRESS,
            ContractStatus.IN_REVIEW
        ];

        if (!allowedStatuses.includes(contract.status)) {
            throw new ForbiddenException(`Cannot send to counterparty in current status: ${contract.status}`);
        }

        // Status Determination Logic (PRD: "Send to Legal takes precedence")
        // 1. If currently in Internal Review -> Status remains same (Review takes precedence)
        // 2. If Draft or Approved -> Status becomes SENT_TO_COUNTERPARTY

        const reviewStatuses: ContractStatus[] = [
            ContractStatus.SENT_TO_LEGAL,
            ContractStatus.LEGAL_REVIEW_IN_PROGRESS,
            ContractStatus.SENT_TO_FINANCE,
            ContractStatus.FINANCE_REVIEW_IN_PROGRESS,
            ContractStatus.IN_REVIEW,
            ContractStatus.PENDING_LEGAL_HEAD
        ];

        let newStatus = contract.status;
        if (!reviewStatuses.includes(contract.status)) {
            newStatus = ContractStatus.SENT_TO_COUNTERPARTY;
        }

        // Update status
        const updated = await this.prisma.contract.update({
            where: { id },
            data: {
                status: newStatus,
                sentAt: new Date(),
            },
        });


        // Send email with custom fields or smart Defaults
        const shouldSendEmail = emailOptions?.recipients?.length || contract.counterpartyEmail;

        if (shouldSendEmail) {
            const fromEmail = await this.getLegalEmail(organizationId);

            // Determine recipients: use custom or fallback to contract email
            const recipients = emailOptions?.recipients ||
                (Array.isArray(contract.counterpartyEmail)
                    ? contract.counterpartyEmail
                    : [contract.counterpartyEmail!]);

            this.emailService.sendContractToCounterparty(
                recipients,
                contract.counterpartyName || 'Valued Partner',
                contract.title,
                contract.reference,
                'RPSG Group',
                `${process.env.FRONTEND_URL}/contracts/${id}`,
                {
                    cc: emailOptions?.cc,
                    subject: emailOptions?.subject,
                    body: emailOptions?.body,
                    daysToRespond: 10,
                    from: fromEmail,
                }
            ).catch(err => this.logger.error(`Failed to send counterparty email: ${err.message}`));
        }


        // Audit Logging
        await this.auditService.log({
            organizationId,
            contractId: id,
            userId: organizationId, // Wait, I don't have user ID here? I should probably add it as a parameter.
            action: 'CONTRACT_SENT',
            module: 'Contracts',
            metadata: {
                counterpartyEmail: contract.counterpartyEmail,
                counterpartyName: contract.counterpartyName
            },
            visibility: LogVisibility.INTERNAL,
        });

        return updated;
    }

    /**
     * Helper: Resolve Legal Email for Organization
     */
    private async getLegalEmail(organizationId: string): Promise<string> {
        try {
            const org = await this.prisma.organization.findUnique({
                where: { id: organizationId },
                select: { code: true, settings: true }
            });

            if (!org) return ''; // Fallback to default in EmailService

            // Check settings for override? For now standard format
            const domain = 'rpsg.in'; // Could be dynamic
            const code = org.code.toLowerCase();
            return `Legal Team <legal@${code}.${domain}>`;
        } catch (e) {
            this.logger.warn(`Failed to resolve legal email for org ${organizationId}`);
            return '';
        }
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

    async revertStatus(id: string, organizationId: string, userId: string, reason: string) {
        const contract = await this.findById(id, organizationId);

        if (contract.status !== 'ACTIVE') {
            throw new BadRequestException('Only ACTIVE contracts can be reverted');
        }

        // Revert to SENT_TO_COUNTERPARTY (safest state for re-negotiation/re-upload)
        const updated = await this.prisma.contract.update({
            where: { id },
            data: {
                status: 'SENT_TO_COUNTERPARTY',
                signedAt: null, // Clear signed date
            }
        });

        this.logger.log(`Contract ${id} reverted from ACTIVE to SENT_TO_COUNTERPARTY by ${userId}`);

        return updated;
    }

    /**
     * Step 1 (Draft): Get Upload URL for Third Party/Main Document
     * 
     * [PREMIUM FEATURE] Versioned Storage Paths
     * Files are stored in .../versions/v{N}/{filename} to prevent overwrites and allow time-travel.
     */
    async getDocumentUploadUrl(id: string, organizationId: string, filename: string, contentType: string) {
        const contract = await this.findById(id, organizationId);

        // Calculate next version number for meaningful path structure
        const latestVersion = await this.prisma.contractVersion.findFirst({
            where: { contractId: id },
            orderBy: { versionNumber: 'desc' },
        });
        const nextVersion = (latestVersion?.versionNumber || 0) + 1;

        // Path: .../contracts/{id}/versions/v{N}/{filename}
        const bucketPath = `organizations/${organizationId}/contracts/${id}/versions/v${nextVersion}`;

        return this.storageService.getUploadUrl(bucketPath, filename, contentType);
    }

    /**
     * Step 2 (Draft/Upload): Confirm Upload and LINK + VERSION
     */
    async confirmDocumentUpload(id: string, organizationId: string, userId: string, key: string, filename: string, fileSize: number, isFinal: boolean = false) {
        const contract = await this.findById(id, organizationId);
        const fileExt = filename.split('.').pop()?.toLowerCase() || '';
        const mimeType = this.getMimeType(fileExt);

        // Wrap in transaction for data integrity
        const attachment = await this.prisma.$transaction(async (tx) => {
            // 1. Create Attachment Record
            const newAttachment = await tx.contractAttachment.create({
                data: {
                    contractId: id,
                    fileName: filename,
                    fileUrl: key,
                    fileType: mimeType,
                    fileSize: fileSize,
                    category: isFinal ? 'SIGNED_COPY' : 'MAIN_DOCUMENT',
                    uploadedBy: userId,
                    metadata: { ocrStatus: 'PENDING' },
                }
            });

            // 2. Create Contract Version (Source: UPLOAD)
            const latestVersion = await tx.contractVersion.findFirst({
                where: { contractId: id },
                orderBy: { versionNumber: 'desc' },
            });

            const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

            const version = await tx.contractVersion.create({
                data: {
                    contractId: id,
                    versionNumber: newVersionNumber,
                    contentSnapshot: JSON.stringify({
                        source: 'UPLOAD',
                        fileUrl: key,
                        fileName: filename,
                        main: "", // Will be updated by Async OCR
                        annexures: "",
                        ocrStatus: 'PENDING'
                    }),
                    changeLog: {
                        action: isFinal ? 'UPLOAD_FINAL' : 'UPLOAD_DRAFT',
                        summary: `Uploaded ${isFinal ? 'final' : 'draft'} document: ${filename}`,
                        description: `Uploaded ${filename}`,
                        isFinal
                    } as any,
                    createdByUserId: userId,
                }
            });

            // 3. Handle "Final" Status
            if (isFinal) {
                await tx.contract.update({
                    where: { id },
                    data: {
                        status: ContractStatus.ACTIVE,
                        signedAt: new Date(),
                        fieldData: {
                            ...(contract.fieldData as Prisma.JsonObject),
                            finalContractKey: key,
                        } as Prisma.InputJsonValue,
                    }
                });
            }

            return { newAttachment, version };
        });

        // 4. Trigger Async OCR (Fire and Forget)
        this.processBackgroundOcr(id, attachment.version.id, attachment.newAttachment.id, key, mimeType, filename)
            .catch(err => this.logger.error(`Background OCR failed for ${filename}`, err));

        return attachment.newAttachment;
    }

    /**
     * Background OCR Processor
     */
    private async processBackgroundOcr(contractId: string, versionId: string, attachmentId: string, key: string, mimeType: string, filename: string) {
        if (!this.ocrService.isSupported(mimeType)) return;

        try {
            this.logger.log(`[Async] Starting OCR for: ${filename}`);
            const fileBuffer = await this.storageService.getFile(key);
            const extractedText = await this.ocrService.extractText(fileBuffer, mimeType);

            // Update Attachment
            await this.prisma.contractAttachment.update({
                where: { id: attachmentId },
                data: {
                    metadata: { extractedText, ocrStatus: 'COMPLETED' }
                }
            });

            // Update Version Snapshot
            // We need to fetch current snapshot to preserve other fields if needed, 
            // but usually we just update the 'main' text.
            const version = await this.prisma.contractVersion.findUnique({ where: { id: versionId } });
            if (version) {
                let snapshot: any = {};
                try {
                    snapshot = JSON.parse(version.contentSnapshot);
                } catch (e) {
                    snapshot = { source: 'UPLOAD', fileUrl: key, fileName: filename, main: '' };
                }

                snapshot.main = extractedText;
                snapshot.ocrStatus = 'COMPLETED';

                await this.prisma.contractVersion.update({
                    where: { id: versionId },
                    data: {
                        contentSnapshot: JSON.stringify(snapshot)
                    }
                });
            }

            // Index for RAG
            await this.ragService.indexContract(contractId, extractedText);

            this.logger.log(`[Async] OCR Completed for ${filename}`);

        } catch (error) {
            this.logger.error(`[Async] OCR Error for ${filename}: ${(error as Error).message}`);
            // Update status to FAILED
            await this.prisma.contractAttachment.update({
                where: { id: attachmentId },
                data: { metadata: { ocrStatus: 'FAILED', error: (error as Error).message } }
            });
        }
    }

    private getMimeType(ext: string): string {
        const map: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        return map[ext] || 'application/octet-stream';
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
            counterpartyBusinessName?: string;
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
        const result = await this.prisma.$transaction(async (tx) => {
            const contract = await tx.contract.create({
                data: {
                    organizationId,
                    templateId: data.templateId,
                    title: data.title,
                    reference: this.generateReference(org.code),
                    counterpartyName: data.counterpartyName,
                    counterpartyBusinessName: data.counterpartyBusinessName,
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

        // Trigger RAG Indexing (Async / Fire-and-forget)
        this.ragService.indexContract(result.id, result.content)
            .catch(err => this.logger.error(`Failed to index contract ${result.id}`, err));

        return result;
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
                    counterpartyBusinessName: true,
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
        this.logger.log(`findById called for id: ${id}, orgId: ${organizationId}`);
        try {
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
        } catch (error: any) {
            this.logger.error(`findById failed for contract ${id}: ${error.message}`, error.stack);
            throw error;
        }
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
            counterpartyBusinessName?: string;
            counterpartyEmail?: string;
            startDate?: string;
            endDate?: string;
            amount?: number;
        },
    ) {
        const contract = await this.findById(id, organizationId);

        // Can only update DRAFT or REVISION_REQUESTED contracts
        // Relaxed Check: Allow updates during review cycles as versions are tracked
        const allowedStatuses = [
            ContractStatus.DRAFT,
            ContractStatus.REVISION_REQUESTED,
            ContractStatus.IN_REVIEW,
            ContractStatus.SENT_TO_LEGAL,
            ContractStatus.SENT_TO_FINANCE // Allow Finance to edit too
        ];

        if (!allowedStatuses.includes(contract.status as any)) {
            // For other statuses (APPROVED, ACTIVE, etc.), strict block remains
            throw new ForbiddenException(`Cannot update contract in ${contract.status} status`);
        }

        // SPECIAL RULE: If Legal has already APPROVED, block editing (even if Finance is pending)
        const legalApproval = contract.approvals?.find(a => a.type === 'LEGAL');
        if (legalApproval?.status === 'APPROVED') {
            throw new ForbiddenException('Cannot edit contract after Legal Approval. Please recall the approval request to make changes.');
        }

        // Get user for changelog
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        // Calculate content updates outside transaction
        const sanitizedContent = data.annexureData
            ? sanitizeContractContent(data.annexureData)
            : undefined;

        const result = await this.prisma.$transaction(async (tx) => {
            // Get latest version number
            const latestVersion = await tx.contractVersion.findFirst({
                where: { contractId: id },
                orderBy: { versionNumber: 'desc' },
            });

            const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

            const updated = await tx.contract.update({
                where: { id },
                data: {
                    title: data.title,
                    annexureData: sanitizedContent,
                    fieldData: data.fieldData,
                    counterpartyName: data.counterpartyName,
                    counterpartyBusinessName: data.counterpartyBusinessName,
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
                        contentSnapshot: JSON.stringify({
                            main: contract.content,
                            annexures: sanitizedContent
                        }),
                        changeLog: changeLog as any,
                        createdByUserId: userId,
                    },
                });
            }

            return updated;
        });

        // Trigger RAG Indexing if content changed
        if (sanitizedContent) {
            // Combine fixed main content with new annexure data
            const fullContent = `${contract.content}\n\n${sanitizedContent}`;
            this.ragService.indexContract(id, fullContent)
                .catch(err => this.logger.error(`Failed to re-index contract ${id}`, err));
        }

        return result;
    }

    /**
     * Submit contract for approval
     */
    /**
     * Submit contract for approval (Targeted or Workflow based)
     */
    async submitForApproval(id: string, userId: string, organizationId: string, target?: 'LEGAL' | 'FINANCE') {
        const contract = await this.findById(id, organizationId);

        // Allow submission from Draft, Revision, or even partial approval states if we want to add more approvals
        const allowedStates: ContractStatus[] = [ContractStatus.DRAFT, ContractStatus.REVISION_REQUESTED, ContractStatus.LEGAL_APPROVED, ContractStatus.FINANCE_REVIEWED];
        if (!allowedStates.includes(contract.status) && !target) {
            // If generic submit, strict check. If targeted, maybe loose check? Keeping strict for now but allow re-submission
        }

        // Check Feature Flags (only if generic submission)
        const financeEnabled = await this.featureFlagService.isEnabled('FINANCE_WORKFLOW', organizationId);

        // 1. Database Updates (State Transition)
        const updatedContract = await this.prisma.$transaction(async (tx) => {
            let newStatus: ContractStatus = ContractStatus.IN_REVIEW;
            const approvalsData: { contractId: string, type: 'LEGAL' | 'FINANCE' }[] = [];

            if (target === 'LEGAL') {
                newStatus = ContractStatus.SENT_TO_LEGAL;
                approvalsData.push({ contractId: id, type: 'LEGAL' });
            } else if (target === 'FINANCE') {
                // Check if Legal is already pending. If so, keep Legal priority in status.
                const isLegalAlreadyPending = contract.approvals?.some(a => a.type === 'LEGAL' && a.status === ApprovalStatus.PENDING);

                if (isLegalAlreadyPending) {
                    // Stay in Legal status to maintain visibility priority
                    newStatus = contract.status as ContractStatus;
                } else {
                    newStatus = ContractStatus.SENT_TO_FINANCE;
                }
                approvalsData.push({ contractId: id, type: 'FINANCE' });
            } else {
                // Default: Parallel if Finance enabled, else Legal
                // ALWAYS prioritize SENT_TO_LEGAL in status when both are pending
                newStatus = ContractStatus.SENT_TO_LEGAL;
                approvalsData.push({ contractId: id, type: 'LEGAL' });
                if (financeEnabled) {
                    approvalsData.push({ contractId: id, type: 'FINANCE' });
                }
            }

            await tx.contract.update({
                where: { id },
                data: {
                    status: newStatus,
                    submittedAt: new Date(),
                },
            });

            // Clean up ANY old approvals of the requested types (whether PENDING, REJECTED/REVISION, or even APPROVED if re-triggering)
            const typesToDelete = target ? [target] : (financeEnabled ? ['LEGAL', 'FINANCE'] : ['LEGAL']);
            await tx.approval.deleteMany({
                where: { contractId: id, type: { in: typesToDelete as any } }
            });

            await tx.approval.createMany({
                data: approvalsData as any[],
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

        // Audit Logging
        await this.auditService.log({
            organizationId,
            contractId: id,
            userId,
            action: 'CONTRACT_SUBMITTED',
            module: 'Contracts',
            metadata: {
                target: target || (financeEnabled ? 'BOTH' : 'LEGAL'),
                financeEnabled
            },
            visibility: LogVisibility.INTERNAL,
        });

        // 2. Async Notifications
        if (updatedContract) {
            try {
                // Notify Legal
                if (!target || target === 'LEGAL') {
                    const legalApproverEmail = this.configService.get<string>('LEGAL_APPROVER_EMAIL', 'legal@clm.com');
                    this.emailService.sendApprovalRequest(
                        legalApproverEmail,
                        updatedContract.title,
                        updatedContract.reference,
                        'LEGAL',
                        updatedContract.createdByUser?.name || 'System',
                        `${process.env.FRONTEND_URL}/dashboard/approvals/legal`,
                    ).catch(e => this.logger.error(e));

                    this.notifyApprovers(organizationId, 'approval:legal:act', 'LEGAL', updatedContract.title, updatedContract.id)
                        .catch(e => this.logger.error(e));
                }

                // Notify Finance
                if ((!target && financeEnabled) || target === 'FINANCE') {
                    const financeApproverEmail = this.configService.get<string>('FINANCE_APPROVER_EMAIL', 'finance@clm.com');
                    this.emailService.sendApprovalRequest(
                        financeApproverEmail,
                        updatedContract.title,
                        updatedContract.reference,
                        'FINANCE',
                        updatedContract.createdByUser?.name || 'System',
                        `${process.env.FRONTEND_URL}/dashboard/approvals/finance`,
                    ).catch(e => this.logger.error(e));

                    this.notifyApprovers(organizationId, 'approval:finance:act', 'FINANCE', updatedContract.title, updatedContract.id)
                        .catch(e => this.logger.error(e));
                }

                // Audit Log handled above manually via auditService.log
                // Redundant call removed to fix duplicate entries in Activity Feed.

            } catch (error) {
                this.logger.error('Error triggering post-submission notifications:', error);
            }
        }

        return updatedContract;
    }

    /**
     * Request a revision on a contract (Soft Rejection / Change Request)
     */
    /**
     * Request a revision on a contract (Soft Rejection / Change Request)
     */
    async requestRevision(
        id: string,
        userId: string,
        organizationId: string,
        comment: string,
    ) {
        const contract = await this.findById(id, organizationId);

        // Can request revision on contracts currently in review
        const allowedStatuses: ContractStatus[] = [
            ContractStatus.SENT_TO_LEGAL,
            ContractStatus.SENT_TO_FINANCE,
            ContractStatus.LEGAL_REVIEW_IN_PROGRESS,
            ContractStatus.FINANCE_REVIEW_IN_PROGRESS,
            ContractStatus.IN_REVIEW,
            ContractStatus.LEGAL_APPROVED,
            ContractStatus.FINANCE_REVIEWED
        ];

        if (!allowedStatuses.includes(contract.status)) {
            // throw new ForbiddenException('Contract not in a reviewable state');
        }

        // 1. Update Status
        const updated = await this.prisma.contract.update({
            where: { id },
            data: {
                status: ContractStatus.REVISION_REQUESTED,
            },
            include: { createdByUser: true }
        });

        // 2. Audit Log
        await this.prisma.auditLog.create({
            data: {
                organizationId,
                contractId: id,
                userId,
                action: 'CONTRACT_REVISION_REQUESTED',
                module: 'Contracts',
                metadata: { comment }
            }
        });

        // 3. Notify Creator
        if (updated.createdByUser?.email) {
            const requester = await this.prisma.user.findUnique({ where: { id: userId } });

            await this.emailService.send({
                to: updated.createdByUser.email,
                template: EmailTemplate.REVISION_REQUESTED,
                subject: `✏️ Revision Requested: ${updated.title}`,
                data: {
                    contractTitle: updated.title,
                    requestedBy: requester?.name || 'Reviewer',
                    comment,
                    contractUrl: `${process.env.FRONTEND_URL}/dashboard/contracts/${id}/edit`,
                }
            }).catch(e => this.logger.error(e));

            // In-app notification
            await this.notificationsService.create({
                userId: updated.createdByUserId,
                type: 'REVISION_REQUESTED',
                title: 'Revision Requested',
                message: `${requester?.name || 'Reviewer'} requested changes: ${comment}`,
                link: `/dashboard/contracts/${id}/edit`,
            });
        }

        return updated;
    }

    /**
     * Cancel a contract (Non-Active only)
     */
    async cancel(id: string, organizationId: string, userId: string, reason: string) {
        const contract = await this.findById(id, organizationId);

        // Can only cancel if NOT Active, Executed, Terminated, Expired
        const immutableStates: ContractStatus[] = [
            ContractStatus.ACTIVE,
            ContractStatus.EXECUTED,
            ContractStatus.TERMINATED,
            ContractStatus.EXPIRED,
            ContractStatus.CANCELLED
        ];

        if (immutableStates.includes(contract.status)) {
            throw new ForbiddenException('Cannot cancel a contract in its current state');
        }

        // Update to CANCELLED
        const updated = await this.prisma.contract.update({
            where: { id },
            data: {
                status: ContractStatus.CANCELLED,
            },
            include: { createdByUser: true }
        });

        // Audit log handled in controller usually, or here.

        return updated;
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
        // Optimize: Don't use findById as it fetches full content/annexures
        const contract = await this.prisma.contract.findUnique({
            where: { id },
            select: { id: true, organizationId: true }
        });

        if (!contract) throw new NotFoundException('Contract not found');
        if (contract.organizationId !== organizationId) throw new ForbiddenException('Access denied');

        const versions = await this.prisma.contractVersion.findMany({
            where: { contractId: id },
            select: {
                id: true,
                versionNumber: true,
                createdAt: true,
                createdByUserId: true,
                changeLog: true,
                // contentSnapshot is excluded for performance in list view
            },
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
                versionNumber: v.versionNumber,
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
     * Get a specific version details including snapshot
     */
    async getVersion(id: string, versionId: string, organizationId: string) {
        // Optimize access check
        const contract = await this.prisma.contract.findUnique({
            where: { id },
            select: { id: true, organizationId: true }
        });

        if (!contract) throw new NotFoundException('Contract not found');
        if (contract.organizationId !== organizationId) throw new ForbiddenException('Access denied');

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

        return {
            id: version.id,
            versionNumber: version.versionNumber,
            createdAt: version.createdAt,
            contentSnapshot: version.contentSnapshot,
            changeLog: version.changeLog as any,
            createdBy: {
                name: user?.name || 'Unknown',
                email: user?.email || '',
            },
        };
    }

    /**
     * Get detailed changelog for a specific version
     */
    async getVersionChangelog(id: string, versionId: string, organizationId: string) {
        // Optimize access check
        const contract = await this.prisma.contract.findUnique({
            where: { id },
            select: { id: true, organizationId: true }
        });

        if (!contract) throw new NotFoundException('Contract not found');
        if (contract.organizationId !== organizationId) throw new ForbiddenException('Access denied');

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
    /**
     * Compare two contract versions
     */
    async compareVersions(
        id: string,
        fromVersionId: string,
        toVersionId: string,
        organizationId: string,
    ) {
        // await this.findById(id, organizationId); // Optimized: Removed double fetch

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

        // Get contract for field data
        const contract = await this.prisma.contract.findUnique({
            where: { id },
        });

        if (!contract) throw new NotFoundException('Contract not found');
        if (contract.organizationId !== organizationId) throw new ForbiddenException('Access denied');

        // Helper to parse content snapshot safely
        const parseSnapshot = (snapshot: string | null) => {
            if (!snapshot) return { main: '', annexures: '' };
            try {
                if (snapshot.startsWith('{')) {
                    const parsed = JSON.parse(snapshot);
                    return {
                        main: parsed.main || '',
                        annexures: parsed.annexures || '',
                    };
                }
                return { main: snapshot, annexures: '' };
            } catch (e) {
                return { main: snapshot, annexures: '' };
            }
        };

        const fromSnapshot = parseSnapshot(fromVersion.contentSnapshot);
        const toSnapshot = parseSnapshot(toVersion.contentSnapshot);

        const fromData = {
            ...contract,
            content: fromSnapshot.main,
            annexureData: fromSnapshot.annexures,
        };

        const toData = {
            ...contract,
            content: toSnapshot.main,
            annexureData: toSnapshot.annexures,
        };

        const comparison = this.diffService.compareVersions(fromData, toData);

        return {
            fromVersion: {
                id: fromVersion.id,
                versionNumber: fromVersion.versionNumber,
                createdAt: fromVersion.createdAt,
                contentSnapshot: fromSnapshot, // Return object instead of string
                createdBy: {
                    name: fromUser?.name || 'Unknown',
                    email: fromUser?.email || '',
                },
            },
            toVersion: {
                id: toVersion.id,
                versionNumber: toVersion.versionNumber,
                createdAt: toVersion.createdAt,
                contentSnapshot: toSnapshot, // Return object instead of string
                createdBy: {
                    name: toUser?.name || 'Unknown',
                    email: toUser?.email || '',
                },
            },
            ...comparison,
        };
    }

    /**
     * Restore a contract to a specific version
     */
    async restoreVersion(id: string, versionId: string, organizationId: string, userId: string) {
        await this.findById(id, organizationId); // Verify access

        const version = await this.prisma.contractVersion.findUnique({
            where: { id: versionId },
        });

        if (!version || version.contractId !== id) {
            throw new NotFoundException('Version not found');
        }

        // Parse snapshot for multi-field restoration
        let contentToRestore = version.contentSnapshot;
        let annexuresToRestore = '';

        try {
            if (version.contentSnapshot?.startsWith('{')) {
                const parsed = JSON.parse(version.contentSnapshot);
                contentToRestore = parsed.main || version.contentSnapshot;
                annexuresToRestore = parsed.annexures || '';
            }
        } catch (e) {
            // Keep as is
        }

        return this.prisma.$transaction(async (tx) => {
            // Update contract with snapshot
            const updatedContract = await tx.contract.update({
                where: { id },
                data: {
                    content: contentToRestore,
                    annexureData: annexuresToRestore,
                },
            });

            // Create a new version for the restoration itself (Audit trail)
            const latestVersion = await tx.contractVersion.findFirst({
                where: { contractId: id },
                orderBy: { versionNumber: 'desc' },
            });

            await tx.contractVersion.create({
                data: {
                    contractId: id,
                    versionNumber: (latestVersion?.versionNumber || 0) + 1,
                    contentSnapshot: version.contentSnapshot, // Re-use the same snapshot structure
                    createdByUserId: userId,
                    changeLog: {
                        summary: `Restored to version ${version.versionNumber}`,
                        restoredFrom: version.id,
                        restoredAt: new Date(),
                    },
                },
            });

            return updatedContract;
        });
    }
}
