import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../common/email/email.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('nanoid', () => ({
    nanoid: () => 'mock-id',
}));

describe('AuthService', () => {
    let service: AuthService;
    let redisService: RedisService;
    let usersService: UsersService;

    const mockUsersService = {
        findByEmail: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockPrismaService = {
        userOrganizationRole: {
            findMany: jest.fn(),
        },
        user: {
            update: jest.fn(),
        },
    };

    const mockRedisService = {
        isAccountLocked: jest.fn(),
        getLockoutTimeRemaining: jest.fn(),
        incrementLoginAttempts: jest.fn(),
        resetLoginAttempts: jest.fn(),
        storePasswordResetToken: jest.fn(),
        validatePasswordResetToken: jest.fn(),
        blacklistToken: jest.fn(),
    };

    const mockEmailService = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: mockUsersService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: RedisService, useValue: mockRedisService },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        redisService = module.get<RedisService>(RedisService);
        usersService = module.get<UsersService>(UsersService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should throw if account is locked', async () => {
            mockRedisService.isAccountLocked.mockResolvedValue(true);
            mockRedisService.getLockoutTimeRemaining.mockResolvedValue(300);

            await expect(service.validateUser('test@example.com', 'pass')).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should return user if credentials are valid', async () => {
            const passwordHash = await bcrypt.hash('password', 10);
            const user = {
                id: '1',
                email: 'test@example.com',
                passwordHash,
                isActive: true,
                mustChangePassword: false
            };

            mockRedisService.isAccountLocked.mockResolvedValue(false);
            mockUsersService.findByEmail.mockResolvedValue(user);

            const result = await service.validateUser('test@example.com', 'password');
            expect(result).toEqual(user);
            expect(mockRedisService.resetLoginAttempts).toHaveBeenCalledWith('test@example.com');
        });

        it('should increment lockout counter on invalid password', async () => {
            const passwordHash = await bcrypt.hash('password', 10);
            const user = {
                id: '1',
                email: 'test@example.com',
                passwordHash,
                isActive: true,
                mustChangePassword: false
            };

            mockRedisService.isAccountLocked.mockResolvedValue(false);
            mockUsersService.findByEmail.mockResolvedValue(user);

            await expect(service.validateUser('test@example.com', 'wrongpass')).rejects.toThrow(
                UnauthorizedException,
            );
            expect(mockRedisService.incrementLoginAttempts).toHaveBeenCalledWith('test@example.com');
        });
    });

    describe('forgotPassword', () => {
        it('should send email if user exists', async () => {
            const user = { id: '1', email: 'test@example.com', name: 'Test User', isActive: true, mustChangePassword: false };
            mockUsersService.findByEmail.mockResolvedValue(user);
            mockRedisService.storePasswordResetToken.mockResolvedValue(undefined);
            mockEmailService.send.mockResolvedValue({ success: true });

            await service.forgotPassword('test@example.com');

            expect(mockRedisService.storePasswordResetToken).toHaveBeenCalled();
            expect(mockEmailService.send).toHaveBeenCalled();
        });
    });
});
