import { Test, TestingModule } from '@nestjs/testing';
import { ContractVersionService } from './contract-version.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DiffService } from '../../common/services/diff.service';
import {
    createMockPrismaService,
    createMockDiffService,
    mockContract,
    mockContractVersion,
} from '../../../test/utils/mock-factory';

describe('ContractVersionService', () => {
    let service: ContractVersionService;
    let prismaService: ReturnType<typeof createMockPrismaService>;
    let diffService: ReturnType<typeof createMockDiffService>;

    beforeEach(async () => {
        prismaService = createMockPrismaService();
        diffService = createMockDiffService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractVersionService,
                { provide: PrismaService, useValue: prismaService },
                { provide: DiffService, useValue: diffService },
            ],
        }).compile();

        service = module.get<ContractVersionService>(ContractVersionService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createVersion', () => {
        it('should create first version (v1) for new contract', async () => {
            // Arrange
            const newVersion = {
                ...mockContractVersion,
                versionNumber: 1,
                contentSnapshot: JSON.stringify({ title: mockContract.title }),
            };
            prismaService.contractVersion.findMany.mockResolvedValue([]);
            prismaService.contractVersion.create.mockResolvedValue(newVersion);

            // Act
            const result = await service.createVersion(mockContract, 'user-123');

            // Assert
            expect(prismaService.contractVersion.create).toHaveBeenCalledWith({
                data: {
                    contractId: mockContract.id,
                    versionNumber: 1,
                    contentSnapshot: expect.any(String),
                    changeLog: null,
                    createdByUserId: 'user-123',
                },
            });
            expect(result.versionNumber).toBe(1);
        });

        it('should create incremental version with changelog', async () => {
            // Arrange
            const previousVersions = [
                { ...mockContractVersion, versionNumber: 1 },
                { ...mockContractVersion, id: 'v2', versionNumber: 2 },
            ];
            const newVersion = {
                ...mockContractVersion,
                id: 'v3',
                versionNumber: 3,
                changeLog: { changes: ['Updated amount'] },
            };

            prismaService.contractVersion.findMany.mockResolvedValue(previousVersions);
            prismaService.contractVersion.create.mockResolvedValue(newVersion);
            diffService.calculateChangelog.mockReturnValue({
                changes: ['Updated amount from $10,000 to $50,000'],
                summary: 'Amount changed',
            });

            // Act
            const result = await service.createVersion(mockContract, 'user-123');

            // Assert
            expect(diffService.calculateChangelog).toHaveBeenCalled();
            expect(result.versionNumber).toBe(3);
            expect(result.changeLog).toEqual({ changes: ['Updated amount'] });
        });
    });

    describe('getVersionHistory', () => {
        it('should return all versions for a contract', async () => {
            // Arrange
            const versions = [
                { ...mockContractVersion, versionNumber: 1 },
                { ...mockContractVersion, id: 'v2', versionNumber: 2 },
                { ...mockContractVersion, id: 'v3', versionNumber: 3 },
            ];
            prismaService.contractVersion.findMany.mockResolvedValue(versions);

            // Act
            const result = await service.getVersionHistory('contract-123');

            // Assert
            expect(prismaService.contractVersion.findMany).toHaveBeenCalledWith({
                where: { contractId: 'contract-123' },
                orderBy: { versionNumber: 'desc' },
            });
            expect(result).toHaveLength(3);
            expect(result[0].versionNumber).toBe(1);
        });

        it('should return empty array if no versions exist', async () => {
            // Arrange
            prismaService.contractVersion.findMany.mockResolvedValue([]);

            // Act
            const result = await service.getVersionHistory('contract-123');

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('compareVersions', () => {
        it('should compare two versions and return diff', async () => {
            // Arrange
            const v1 = {
                ...mockContractVersion,
                versionNumber: 1,
                contentSnapshot: JSON.stringify({ title: 'Original Title', amount: 10000 }),
            };
            const v2 = {
                ...mockContractVersion,
                id: 'v2',
                versionNumber: 2,
                contentSnapshot: JSON.stringify({ title: 'Updated Title', amount: 50000 }),
            };

            prismaService.contractVersion.findUnique
                .mockResolvedValueOnce(v1)
                .mockResolvedValueOnce(v2);
            prismaService.contract.findUnique.mockResolvedValue(mockContract);
            diffService.compareVersions.mockReturnValue({
                fieldChanges: [
                    { field: 'title', oldValue: 'Original Title', newValue: 'Updated Title' },
                    { field: 'amount', oldValue: 10000, newValue: 50000 },
                ],
                contentDiff: { added: [], removed: [], modified: ['title', 'amount'] },
            });

            // Act
            const result = await service.compareVersions('contract-123', 1, 2);

            // Assert
            expect(diffService.compareVersions).toHaveBeenCalledWith(
                { title: 'Original Title', amount: 10000 },
                { title: 'Updated Title', amount: 50000 }
            );
            expect(result.fieldChanges).toHaveLength(2);
            expect(result.fromVersion).toBe(1);
            expect(result.toVersion).toBe(2);
        });

        it('should throw error if version not found', async () => {
            // Arrange
            prismaService.contractVersion.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.compareVersions('contract-123', 1, 2)
            ).rejects.toThrow();
        });
    });

    describe('getVersion', () => {
        it('should return specific version by number', async () => {
            // Arrange
            const version = { ...mockContractVersion, versionNumber: 2 };
            prismaService.contractVersion.findUnique.mockResolvedValue(version);

            // Act
            const result = await service.getVersion('contract-123', 2);

            // Assert
            expect(prismaService.contractVersion.findUnique).toHaveBeenCalledWith({
                where: {
                    contractId_versionNumber: {
                        contractId: 'contract-123',
                        versionNumber: 2,
                    },
                },
            });
            expect(result.versionNumber).toBe(2);
        });
    });
});
