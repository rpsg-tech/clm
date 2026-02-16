import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ContractWorkflowService } from './contract-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagService } from '../../config/feature-flag.service';
import { AuditService } from '../../audit/audit.service';
import {
    createMockPrismaService,
    createMockFeatureFlagService,
    createMockAuditService,
    mockContract,
    mockApproval,
} from '../../../test/utils/mock-factory';

describe('ContractWorkflowService', () => {
    let service: ContractWorkflowService;
    let prismaService: ReturnType<typeof createMockPrismaService>;
    let featureFlagService: ReturnType<typeof createMockFeatureFlagService>;
    let auditService: ReturnType<typeof createMockAuditService>;

    beforeEach(async () => {
        prismaService = createMockPrismaService();
        featureFlagService = createMockFeatureFlagService();
        auditService = createMockAuditService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractWorkflowService,
                { provide: PrismaService, useValue: prismaService },
                { provide: FeatureFlagService, useValue: featureFlagService },
                { provide: AuditService, useValue: auditService },
            ],
        }).compile();

        service = module.get<ContractWorkflowService>(ContractWorkflowService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('submitForApproval', () => {
        it('should create legal approval when finance workflow disabled', async () => {
            // Arrange
            featureFlagService.isEnabled.mockResolvedValue(false);
            const contractWithApprovals = {
                ...mockContract,
                status: 'IN_REVIEW',
                submittedAt: expect.any(Date),
                approvals: [mockApproval],
                createdByUser: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
            };

            prismaService.$transaction.mockImplementation(async (callback) => {
                return contractWithApprovals;
            });

            // Act
            const result = await service.submitForApproval('contract-123', 'org-123', 'user-123');

            // Assert
            expect(featureFlagService.isEnabled).toHaveBeenCalledWith('FINANCE_WORKFLOW', 'org-123');
            expect(result).toEqual(contractWithApprovals);
        });

        it('should create both legal and finance approvals when finance workflow enabled', async () => {
            // Arrange
            featureFlagService.isEnabled.mockResolvedValue(true);
            const contractWithBothApprovals = {
                ...mockContract,
                status: 'IN_REVIEW',
                submittedAt: expect.any(Date),
                approvals: [
                    { ...mockApproval, type: 'LEGAL' },
                    { ...mockApproval, id: 'approval-456', type: 'FINANCE' },
                ],
            };

            prismaService.$transaction.mockImplementation(async (callback) => {
                return contractWithBothApprovals;
            });

            // Act
            const result = await service.submitForApproval('contract-123', 'org-123', 'user-123');

            // Assert
            expect(featureFlagService.isEnabled).toHaveBeenCalledWith('FINANCE_WORKFLOW', 'org-123');
            expect(result?.approvals).toHaveLength(2);
        });
    });

    describe('requestRevision', () => {
        it('should update contract status to REVISION_REQUESTED', async () => {
            // Arrange
            const revisedContract = {
                ...mockContract,
                status: 'REVISION_REQUESTED' as any,
                createdByUser: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
            };
            prismaService.contract.update.mockResolvedValue(revisedContract);

            // Act
            const result = await service.requestRevision(
                'contract-123',
                'approver-123',
                'org-123',
                'Please update clause 5'
            );

            // Assert
            expect(prismaService.contract.update).toHaveBeenCalledWith({
                where: { id: 'contract-123' },
                data: { status: 'REVISION_REQUESTED' },
                include: { createdByUser: true },
            });
            expect(result.status).toBe('REVISION_REQUESTED');
        });
    });

    describe('sendToCounterparty', () => {
        it('should update status to SENT_TO_COUNTERPARTY for approved contracts', async () => {
            // Arrange
            const approvedContract = { ...mockContract, status: 'APPROVED' as any };
            const sentContract = {
                ...approvedContract,
                status: 'SENT_TO_COUNTERPARTY' as any,
                sentAt: expect.any(Date),
            };

            prismaService.contract.findUnique.mockResolvedValue(approvedContract);
            prismaService.contract.update.mockResolvedValue(sentContract);

            // Act
            const result = await service.sendToCounterparty('contract-123');

            // Assert
            expect(prismaService.contract.update).toHaveBeenCalledWith({
                where: { id: 'contract-123' },
                data: {
                    status: 'SENT_TO_COUNTERPARTY',
                    sentAt: expect.any(Date),
                },
            });
            expect(result.status).toBe('SENT_TO_COUNTERPARTY');
        });

        it('should throw ForbiddenException if contract is not approved', async () => {
            // Arrange
            const draftContract = { ...mockContract, status: 'DRAFT' as any };
            prismaService.contract.findUnique.mockResolvedValue(draftContract);

            // Act & Assert
            await expect(
                service.sendToCounterparty('contract-123')
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('activateContract', () => {
        it('should activate contract with signed document', async () => {
            // Arrange
            const approvedContract = {
                ...mockContract,
                status: 'SENT_TO_COUNTERPARTY' as any,
                fieldData: {},
            };
            const activeContract = {
                ...approvedContract,
                status: 'ACTIVE' as any,
                signedAt: expect.any(Date),
                fieldData: { signedContractKey: 'signed-doc-key' },
            };

            prismaService.contract.findUnique.mockResolvedValue(approvedContract);
            prismaService.contract.update.mockResolvedValue(activeContract);

            // Act
            const result = await service.activateContract('contract-123', 'signed-doc-key');

            // Assert
            expect(prismaService.contract.update).toHaveBeenCalledWith({
                where: { id: 'contract-123' },
                data: {
                    status: 'ACTIVE',
                    signedAt: expect.any(Date),
                    fieldData: {
                        signedContractKey: 'signed-doc-key',
                    },
                },
                include: {
                    createdByUser: true,
                },
            });
            expect(result.status).toBe('ACTIVE');
        });

        it('should throw error if contract not found', async () => {
            // Arrange
            prismaService.contract.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.activateContract('nonexistent-123', 'signed-doc-key')
            ).rejects.toThrow('Contract not found');
        });
    });
});
