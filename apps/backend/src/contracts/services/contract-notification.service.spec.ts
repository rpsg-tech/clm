import { Test, TestingModule } from '@nestjs/testing';
import { ContractNotificationService } from './contract-notification.service';
import { EmailService } from '../../common/email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
    createMockEmailService,
    createMockNotificationsService,
    createMockPrismaService,
    createMockConfigService,
    mockContract,
    mockUser,
} from '../../../test/utils/mock-factory';

describe('ContractNotificationService', () => {
    let service: ContractNotificationService;
    let emailService: ReturnType<typeof createMockEmailService>;
    let notificationsService: ReturnType<typeof createMockNotificationsService>;
    let prismaService: ReturnType<typeof createMockPrismaService>;
    let configService: ReturnType<typeof createMockConfigService>;

    beforeEach(async () => {
        emailService = createMockEmailService();
        notificationsService = createMockNotificationsService();
        prismaService = createMockPrismaService();
        configService = createMockConfigService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractNotificationService,
                { provide: EmailService, useValue: emailService },
                { provide: NotificationsService, useValue: notificationsService },
                { provide: PrismaService, useValue: prismaService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<ContractNotificationService>(ContractNotificationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('notifyApprovalRequest', () => {
        it('should send email to legal approver when contract submitted', async () => {
            // Arrange
            const contractWithUser = {
                ...mockContract,
                createdByUser: mockUser,
            };
            prismaService.user.findMany.mockResolvedValue([{ id: 'legal-user' } as any]);

            // Act
            await service.notifyApprovalRequest(
                'org-123',
                contractWithUser.id,
                contractWithUser.title,
                contractWithUser.reference,
                mockUser.name,
                'LEGAL'
            );

            // Assert
            expect(emailService.sendApprovalRequest).toHaveBeenCalledWith(
                'legal@example.com',
                mockContract.title,
                mockContract.reference,
                'LEGAL',
                mockUser.name,
                expect.stringContaining('/dashboard/approvals/legal')
            );
        });

        it('should send email to finance approver when finance approval needed', async () => {
            // Arrange
            const contractWithUser = {
                ...mockContract,
                createdByUser: mockUser,
            };
            prismaService.user.findMany.mockResolvedValue([{ id: 'finance-user' } as any]);

            // Act
            await service.notifyApprovalRequest(
                'org-123',
                contractWithUser.id,
                contractWithUser.title,
                contractWithUser.reference,
                mockUser.name,
                'FINANCE'
            );

            // Assert
            expect(emailService.sendApprovalRequest).toHaveBeenCalledWith(
                'finance@example.com',
                mockContract.title,
                mockContract.reference,
                'FINANCE',
                mockUser.name,
                expect.stringContaining('/dashboard/approvals/finance')
            );
        });

        it('should create in-app notification for approver', async () => {
            // Arrange
            const contractWithUser = {
                ...mockContract,
                createdByUser: mockUser,
            };
            prismaService.user.findMany.mockResolvedValue([
                { ...mockUser, id: 'legal-user-123' },
            ]);

            // Act
            await service.notifyApprovalRequest(
                'org-123',
                contractWithUser.id,
                contractWithUser.title,
                contractWithUser.reference,
                mockUser.name,
                'LEGAL'
            );

            // Assert
            expect(notificationsService.create).toHaveBeenCalled();
        });
    });

    describe('notifyRevisionRequest', () => {
        it('should send revision request email to contract creator', async () => {
            // Arrange
            prismaService.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await service.notifyRevisionRequest(
                'user-123',
                'Test Service Agreement',
                'contract-123',
                'Approver Name',
                'Please update clause 5'
            );

            // Assert
            expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
                to: mockUser.email,
                subject: expect.stringContaining('Revision Requested'),
                data: expect.objectContaining({
                    contractTitle: 'Test Service Agreement',
                    requestedBy: 'Approver Name',
                    comment: 'Please update clause 5',
                }),
            }));
        });

        it('should create in-app notification for creator', async () => {
            // Arrange
            prismaService.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await service.notifyRevisionRequest(
                'user-123',
                'Test Service Agreement',
                'contract-123',
                'Approver Name',
                'Please update clause 5'
            );

            // Assert
            expect(notificationsService.create).toHaveBeenCalledWith({
                userId: 'user-123',
                type: 'REVISION_REQUESTED',
                title: expect.stringContaining('Revision Requested'),
                message: expect.stringContaining('Approver Name'),
                link: expect.stringContaining('/contracts/contract-123/edit'),
            });
        });
    });



    describe('notifyContractActivated', () => {
        it('should send activation email to contract creator', async () => {
            // Arrange
            const contractData = {
                title: 'Test Service Agreement',
                reference: 'REF-2024-001',
                createdByUser: { email: 'creator@example.com' },
            };
            prismaService.contract.findUnique.mockResolvedValue(contractData as any);

            // Act
            await service.notifyContractActivated('creator@example.com', 'Contract Title', 'REF-123', 'contract-123');

            // Assert
            expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
                to: 'creator@example.com',
                template: 'CONTRACT_SIGNED' as any,
                subject: expect.stringContaining('Fully Executed'),
                data: expect.objectContaining({
                    contractTitle: 'Contract Title',
                    contractReference: 'REF-123',
                    contractUrl: expect.any(String),
                }),
            }));
        });
    });

    describe('error handling', () => {
        it('should log error but not throw when email fails', async () => {
            // Arrange
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            emailService.send.mockRejectedValue(new Error('SMTP error'));

            // Act & Assert - should not throw
            await expect(
                service.notifyRevisionRequest(
                    'contract-123',
                    'Test',
                    'user-123',
                    'Approver',
                    'Comment'
                )
            ).resolves.not.toThrow();
        });
    });
});
