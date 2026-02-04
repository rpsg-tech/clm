import { Test, TestingModule } from '@nestjs/testing';
import { ContractStorageService } from './contract-storage.service';
import { StorageService } from '../../common/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import {
    createMockStorageService,
    createMockConfigService,
} from '../../../test/utils/mock-factory';

describe('ContractStorageService', () => {
    let service: ContractStorageService;
    let storageService: ReturnType<typeof createMockStorageService>;
    let configService: ReturnType<typeof createMockConfigService>;

    beforeEach(async () => {
        storageService = createMockStorageService();
        configService = createMockConfigService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractStorageService,
                { provide: StorageService, useValue: storageService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<ContractStorageService>(ContractStorageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadContractFile', () => {
        it('should upload file to S3 with correct path', async () => {
            // Arrange
            const contractId = 'contract-123';
            const file = {
                originalname: 'contract.pdf',
                buffer: Buffer.from('test file content'),
                mimetype: 'application/pdf',
            } as Express.Multer.File;

            // Act
            const result = await service.uploadContractFile(contractId, file);

            // Assert
            expect(storageService.uploadFile).toHaveBeenCalledWith({
                file: file.buffer,
                filename: expect.stringContaining('contract-123'),
                contentType: 'application/pdf',
                bucket: 'test-bucket',
                folder: 'contracts',
            });
            expect(result).toEqual({
                key: 'contracts/test-contract.pdf',
                url: expect.stringContaining('s3.aws.com'),
            });
        });

        it('should include organization ID in file path if provided', async () => {
            // Arrange
            const file = {
                originalname: 'contract.pdf',
                buffer: Buffer.from('test'),
                mimetype: 'application/pdf',
            } as Express.Multer.File;

            // Act
            await service.uploadContractFile('contract-123', file, 'org-456');

            // Assert
            expect(storageService.uploadFile).toHaveBeenCalledWith(
                expect.objectContaining({
                    folder: expect.stringContaining('org-456'),
                })
            );
        });
    });

    describe('getSignedUrl', () => {
        it('should generate pre-signed URL for file download', async () => {
            // Arrange
            const fileKey = 'contracts/contract-123/document.pdf';

            // Act
            const result = await service.getSignedUrl(fileKey);

            // Assert
            expect(storageService.getSignedUrl).toHaveBeenCalledWith({
                key: fileKey,
                expiresIn: 3600, // 1 hour
            });
            expect(result).toContain('signed-url');
        });

        it('should support custom expiration time', async () => {
            // Arrange
            const fileKey = 'contracts/test.pdf';
            const customExpiry = 7200; // 2 hours

            // Act
            await service.getSignedUrl(fileKey, customExpiry);

            // Assert
            expect(storageService.getSignedUrl).toHaveBeenCalledWith({
                key: fileKey,
                expiresIn: customExpiry,
            });
        });
    });

    describe('deleteContractFile', () => {
        it('should delete file from S3', async () => {
            // Arrange
            const fileKey = 'contracts/contract-123/document.pdf';

            // Act
            await service.deleteContractFile(fileKey);

            // Assert
            expect(storageService.deleteFile).toHaveBeenCalledWith(fileKey);
        });
    });

    describe('getFileMetadata', () => {
        it('should return file metadata', async () => {
            // Arrange
            const fileKey = 'contracts/test.pdf';

            // Act
            const result = await service.getFileMetadata(fileKey);

            // Assert
            expect(storageService.getFileMetadata).toHaveBeenCalledWith(fileKey);
            expect(result).toEqual({
                size: 1024,
                contentType: 'application/pdf',
            });
        });
    });

    describe('error handling', () => {
        it('should throw error when upload fails', async () => {
            // Arrange
            storageService.uploadFile.mockRejectedValue(new Error('S3 upload failed'));
            const file = {
                originalname: 'contract.pdf',
                buffer: Buffer.from('test'),
                mimetype: 'application/pdf',
            } as Express.Multer.File;

            // Act & Assert
            await expect(
                service.uploadContractFile('contract-123', file)
            ).rejects.toThrow('S3 upload failed');
        });

        it('should throw error when file deletion fails', async () => {
            // Arrange
            storageService.deleteFile.mockRejectedValue(new Error('S3 delete failed'));

            // Act & Assert
            await expect(
                service.deleteContractFile('contracts/test.pdf')
            ).rejects.toThrow('S3 delete failed');
        });
    });
});
