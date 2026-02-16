import { Test, TestingModule } from '@nestjs/testing';
import { ContractVersionService } from './contract-version.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DiffService } from '../../common/services/diff.service';
import {
    createMockPrismaService,
    createMockDiffService,
    mockContract,
    mockUser,
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
            prismaService.contractVersion.findFirst.mockResolvedValue(null);
            prismaService.contractVersion.create.mockResolvedValue(newVersion);
            diffService.calculateChanges.mockReturnValue({
                summary: 'Initial version created',
                changeCount: 0,
                changes: [],
                createdBy: 'user@example.com',
            });

            // Act
            const result = await service.createNewVersion(mockContract.id, 'user-123', null, { content: 'new' }, 'user@example.com');

            // Assert
            expect(prismaService.contractVersion.create).toHaveBeenCalledWith({
                data: {
                    contractId: mockContract.id,
                    versionNumber: 1,
                    contentSnapshot: '{"content":"new"}',
                    changeLog: expect.objectContaining({
                        summary: 'Initial version created',
                        changeCount: 0,
                    }),
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

            prismaService.contractVersion.findFirst.mockResolvedValue(previousVersions[1] as any);
            prismaService.contractVersion.create.mockResolvedValue(newVersion);
            diffService.calculateChanges.mockReturnValue({
                changes: ['Updated amount from $10,000 to $50,000'],
                summary: 'Amount changed',
            });

            // Act
            const result = await service.createNewVersion(mockContract.id, 'user-123', null, { content: 'new' }, 'user@example.com');

            // Assert
            expect(diffService.calculateChanges).toHaveBeenCalled();
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
            prismaService.user.findMany.mockResolvedValue([mockUser]);

            // Act
            const result = await service.getVersions('contract-123');

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
            prismaService.user.findMany.mockResolvedValue([]);

            // Act
            const result = await service.getVersions('contract-123');

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('compareVersions', () => {
        it('should compare two versions and return diff', async () => {
            // Arrange
            const v1 = { ...mockContractVersion, id: 'v1', versionNumber: 1, contentSnapshot: '{"text":"a"}' };
            const v2 = { ...mockContractVersion, id: 'v2', versionNumber: 2, contentSnapshot: '{"text":"b"}' };
            const contract = { title: 'Test Contract' };

            prismaService.contractVersion.findUnique
                .mockResolvedValueOnce(v1 as any)
                .mockResolvedValueOnce(v2 as any);
            prismaService.contract.findUnique.mockResolvedValue(contract as any);

            diffService.compareVersions.mockReturnValue({ changes: [], additions: 1, deletions: 0 });

            // Act
            const result = await service.compareVersions('contract-123', '1', '2'); // Changed version numbers to strings

            // Assert
            expect(result).toEqual(expect.objectContaining({
                contractTitle: 'Test Contract',
                fromVersion: 1,
                toVersion: 2,
            }));
        });

        it('should return null if versions not found', async () => {
            // Arrange
            prismaService.contractVersion.findUnique
                .mockResolvedValueOnce(null) // v1 not found
                .mockResolvedValueOnce(null); // v2 not found
            prismaService.contract.findUnique.mockResolvedValue({ title: 'Test Contract' } as any); // Mock contract for title

            // Act
            const result = await service.compareVersions('contract-123', '1', '2'); // Changed version numbers to strings

            // Assert
            expect(result).toBeNull();
        });

        it('should return null if one version is not found', async () => {
            // Arrange
            const v2 = {
                ...mockContractVersion,
                id: 'v2',
                versionNumber: 2,
                contentSnapshot: JSON.stringify({ title: 'Updated Title', amount: 50000 }),
            };

            prismaService.contractVersion.findUnique
                .mockResolvedValueOnce(null) // v1 not found
                .mockResolvedValueOnce(v2 as any); // v2 found
            prismaService.contract.findUnique.mockResolvedValue({ title: 'Test Contract' } as any); // Mock contract for title

            // Act
            const result = await service.compareVersions('contract-123', '1', '2'); // Changed version numbers to strings

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('getVersionChangelog', () => {
        it('should return the changelog for a specific version', async () => {
            // Arrange
            const version = { ...mockContractVersion, versionNumber: 2, changeLog: { changes: ['Updated amount'] } };
            prismaService.contractVersion.findUnique.mockResolvedValue(version);

            // Act
            const result = await service.getVersionChangelog('contract-123', '2'); // Changed version number to string

            // Assert
            expect(prismaService.contractVersion.findUnique).toHaveBeenCalledWith({
                where: { id: '2' },
            });
            expect(result?.versionNumber).toBe(2);
        });
    });
});
