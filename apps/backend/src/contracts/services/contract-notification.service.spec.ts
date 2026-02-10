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

    describe('notifyContractSubmission', () => {
        it('should send email to legal approver when contract submitted', async () => {
            // Arrange
            const contractWithUser = {
                ...mockContract,
                createdByUser: mockUser,
            };

            // Act
            await service.notifyContractSubmission(contractWithUser, 'LEGAL');

            // Assert
            expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
                to: 'legal@example.com',
                subject: expect.stringContaining('New Contract Requires Your Approval'),
                data: expect.objectContaining({
                    contractTitle: mockContract.title,
                    submittedBy: mockUser.name,
                }),
            }));
        });

        it('should send email to finance approver when finance approval needed', async () => {
            // Arrange
            const contractWithUser = {
                ...mockContract,
                createdByUser: mockUser,
            };

            // Act
            await service.notifyContractSubmission(contractWithUser, 'FINANCE');

            // Assert
            expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
                to: 'finance@example.com',
                subject: expect.stringContaining('New Contract Requires Your Approval'),
            }));
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
            await service.notifyContractSubmission(contractWithUser, 'LEGAL');

            // Assert
            expect(notificationsService.createNotification).toHaveBeenCalled();
        });
    });

    describe('notifyRevisionRequest', () => {
        it('should send revision request email to contract creator', async () => {
            // Arrange
            prismaService.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await service.notifyRevisionRequest(
                'contract-123',
                'Test Service Agreement',
                'user-123',
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
                'contract-123',
                'Test Service Agreement',
                'user-123',
                'Approver Name',
                'Please update clause 5'
            );

            // Assert
            expect(notificationsService.createNotification).toHaveBeenCalledWith({
                userId: 'user-123',
                type: 'CONTRACT_UPDATE',
                title: expect.stringContaining('Revision Requested'),
                message: expect.stringContaining('Approver Name'),
                link: expect.stringContaining('/contracts/contract-123'),
            });
        });
    });

    describe('notifyApprovalResult', () => {
        it('should send approval email when contract approved', async () => {
            // Arrange
            prismaService.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await service.notifyApprovalResult(
                'contract-123',
                'Test Service Agreement',
                'user-123',
                true,
                'LEGAL',
                'Approver Name',
                'Looks good!'
            );

            // Assert
            expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
                to: mockUser.email,
                subject: expect.stringContaining('Approved'),
                data: expect.objectContaining({
                    contractTitle: 'Test Service Agreement',
                    approverName: 'Approver Name',
                    approvalType: 'Legal',
                }),
            }));
        });

        it('should send rejection email when contract rejected', async () => {
            // Arrange
            prismaService.user.findUnique.mockResolvedValue(mockUser);

            // Act
            await service.notifyApprovalResult(
                'contract-123',
                'Test Service Agreement',
                'user-123',
                false,
                'FINANCE',
                'Approver Name',
                'Budget exceeded'
            );

            // Assert
            expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
                to: mockUser.email,
                subject: expect.stringContaining('Rejected'),
                data: expect.objectContaining({
                    contractTitle: 'Test Service Agreement',
                    approvalType: 'Finance',
                    comment: 'Budget exceeded',
                }),
            }));
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
            await service.notifyContractActivated('contract-123');

            // Assert
            expect(emailService.send).toHaveBeenCalledWith(expect.objectContaining({
                to: 'creator@example.com',
                template: 'CONTRACT_SIGNED' as any,
                subject: expect.stringContaining('Fully Executed'),
                data: expect.objectContaining({
                    contractTitle: 'Test Service Agreement',
                    contractReference: 'REF-2024-001',
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
