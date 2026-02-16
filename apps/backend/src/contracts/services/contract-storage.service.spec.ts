import { Test, TestingModule } from '@nestjs/testing';
import { ContractStorageService } from './contract-storage.service';
import { StorageService } from '../../common/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
    createMockStorageService,
    createMockConfigService,
    createMockPrismaService,
} from '../../../test/utils/mock-factory';

describe('ContractStorageService', () => {
    let service: ContractStorageService;
    let storageService: ReturnType<typeof createMockStorageService>;
    let configService: ReturnType<typeof createMockConfigService>;
    let prismaService: ReturnType<typeof createMockPrismaService>;

    beforeEach(async () => {
        storageService = createMockStorageService();
        configService = createMockConfigService();
        prismaService = createMockPrismaService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractStorageService,
                { provide: StorageService, useValue: storageService },
                { provide: ConfigService, useValue: configService },
                { provide: PrismaService, useValue: prismaService },
            ],
        }).compile();

        service = module.get<ContractStorageService>(ContractStorageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSignedContractUploadUrl', () => {
        it('should return presigned url for contract upload', async () => {
            // Arrange
            const contractId = 'contract-123';
            const organizationId = 'org-123';
            const fileName = 'contract.pdf';
            const contentType = 'application/pdf';
            const expectedUrl = 'https://s3.aws.com/signed-upload-url';

            storageService.getUploadUrl.mockResolvedValue(expectedUrl);

            // Act
            const result = await service.getSignedContractUploadUrl(contractId, organizationId, fileName, contentType);

            // Assert
            expect(storageService.getUploadUrl).toHaveBeenCalledWith(
                `organizations/${organizationId}/contracts/${contractId}/signed`,
                fileName,
                contentType
            );
            expect(result).toEqual(expectedUrl);
        });
    });

    describe('getDocumentUploadUrl', () => {
        it('should return presigned url for document upload', async () => {
            // Arrange
            const contractId = 'contract-123';
            const organizationId = 'org-456';
            const fileName = 'document.pdf';
            const contentType = 'application/pdf';
            const expectedUrl = 'https://s3.aws.com/signed-document-upload-url';

            storageService.getUploadUrl.mockResolvedValue(expectedUrl);

            // Act
            const result = await service.getDocumentUploadUrl(contractId, organizationId, fileName, contentType);

            // Assert
            expect(storageService.getUploadUrl).toHaveBeenCalledWith(
                `organizations/${organizationId}/contracts/${contractId}/documents`,
                fileName,
                contentType
            );
            expect(result).toEqual(expectedUrl);
        });
    });

    describe('createAttachment', () => {
        it('should create database record for uploaded file', async () => {
            // Arrange
            const contractId = 'contract-123';
            const key = 'some-s3-key';
            const fileName = 'file.pdf';
            const fileSize = 1024;
            const uploadedBy = 'user-1';

            prismaService.contractAttachment.create.mockResolvedValue({
                id: 'attachment-id',
                contractId,
                fileUrl: key,
                fileName,
                fileSize,
                uploadedBy,
                uploadedAt: new Date(),
                deletedAt: null,
            });

            // Act
            await service.createAttachment(contractId, key, fileName, fileSize, uploadedBy);

            // Assert
            expect(prismaService.contractAttachment.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        contractId,
                        fileUrl: key,
                        fileName,
                        fileSize,
                        uploadedBy,
                    })
                })
            );
        });
    });
});
