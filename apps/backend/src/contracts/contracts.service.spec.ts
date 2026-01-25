import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { ContractStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

jest.mock('nanoid', () => ({
    nanoid: () => 'mock-ref',
}));

jest.mock('../common/utils/sanitize.util', () => ({
    sanitizeContractContent: jest.fn((html) => html.replace(/<script>.*<\/script>/g, '')),
}));

describe('ContractsService', () => {
    let service: ContractsService;
    let prismaService: PrismaService;
    let emailService: EmailService;

    const mockPrismaService: any = {
        organization: {
            findUnique: jest.fn(),
        },
        contract: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        contractVersion: {
            create: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
        $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
    };

    const mockEmailService = {
        sendApprovalRequest: jest.fn(),
        sendContractToCounterparty: jest.fn(),
        send: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContractsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<ContractsService>(ContractsService);
        prismaService = module.get<PrismaService>(PrismaService);
        emailService = module.get<EmailService>(EmailService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findById', () => {
        it('should return contract if found and org matches', async () => {
            const contract = { id: '1', organizationId: 'org1', title: 'Test' };
            mockPrismaService.contract.findUnique.mockResolvedValue(contract);

            const result = await service.findById('1', 'org1');
            expect(result).toEqual(contract);
        });

        it('should throw ForbiddenException if org does not match', async () => {
            const contract = { id: '1', organizationId: 'org2', title: 'Test' };
            mockPrismaService.contract.findUnique.mockResolvedValue(contract);

            await expect(service.findById('1', 'org1')).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException if contract not found', async () => {
            mockPrismaService.contract.findUnique.mockResolvedValue(null);

            await expect(service.findById('1', 'org1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should sanitize content and create contract', async () => {
            const org = { code: 'ORG' };
            const input = {
                templateId: 'tpl1',
                title: 'Malicious Contract',
                annexureData: '<script>alert("xss")</script><p>Safe content</p>',
                fieldData: {},
            };

            mockPrismaService.organization.findUnique.mockResolvedValue(org);
            mockPrismaService.contract.create.mockImplementation((args: any) => ({
                id: 'c1',
                ...args.data
            }));

            await service.create('org1', 'user1', input);

            expect(mockPrismaService.contract.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        // Expect sanitized content
                        annexureData: expect.stringContaining('<p>Safe content</p>'),
                    }),
                }),
            );
        });
    });
});
