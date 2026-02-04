import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

/**
 * Handles file uploads and downloads for contracts (S3 operations)
 * Extracted from ContractsService for Single Responsibility Principle
 */
@Injectable()
export class ContractStorageService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
    ) { }

    /**
     * Get presigned URL for uploading signed contract
     */
    async getSignedContractUploadUrl(
        contractId: string,
        organizationId: string,
        filename: string,
        contentType: string
    ) {
        const bucketPath = `organizations/${organizationId}/contracts/${contractId}/signed`;
        return this.storageService.getUploadUrl(bucketPath, filename, contentType);
    }

    /**
     * Get presigned URL for uploading draft documents
     */
    async getDocumentUploadUrl(
        contractId: string,
        organizationId: string,
        filename: string,
        contentType: string
    ) {
        const bucketPath = `organizations/${organizationId}/contracts/${contractId}/documents`;
        return this.storageService.getUploadUrl(bucketPath, filename, contentType);
    }

    /**
     * Create attachment record after upload
     */
    async createAttachment(
        contractId: string,
        key: string,
        filename: string,
        fileSize: number,
        uploadedBy: string
    ) {
        return this.prisma.contractAttachment.create({
            data: {
                contractId,
                fileName: filename,
                fileUrl: key,
                fileType: 'application/pdf',
                fileSize,
                category: 'MAIN_DOCUMENT',
                uploadedBy,
            }
        });
    }

    /**
     * Get download URL for attachment
     */
    async getAttachmentDownloadUrl(contractId: string, attachmentId: string) {
        const attachment = await this.prisma.contractAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment || attachment.contractId !== contractId) {
            throw new NotFoundException('Attachment not found');
        }

        return {
            url: await this.storageService.getDownloadUrl(attachment.fileUrl),
            filename: attachment.fileName,
            contentType: attachment.fileType
        };
    }

    /**
     * List all attachments for a contract
     */
    async listAttachments(contractId: string) {
        return this.prisma.contractAttachment.findMany({
            where: { contractId },
            orderBy: { uploadedAt: 'desc' }
        });
    }
}
