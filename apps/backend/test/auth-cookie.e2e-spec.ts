import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
const cookieParser = require('cookie-parser');
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AuditService } from '../src/audit/audit.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('AuthController (Integration)', () => {
    let app: INestApplication;

    const mockAuthService = {
        login: jest.fn().mockResolvedValue({
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            user: {
                id: 'user_123',
                email: 'test@example.com',
                organizations: [],
            }
        }),
        getProfile: jest.fn().mockResolvedValue({
            user: { id: 'user_123', email: 'test@example.com' },
            currentOrg: null,
            role: null,
            permissions: []
        }),
        forgotPassword: jest.fn(),
        resetPassword: jest.fn(),
        refreshTokens: jest.fn(),
        switchOrganization: jest.fn(),
        revokeToken: jest.fn(),
    };

    const mockAuditService = {
        log: jest.fn().mockResolvedValue(true),
    };

    // Mock Guard to allow access (though Login is public)
    const mockJwtAuthGuard = {
        canActivate: (context: ExecutionContext) => true,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: AuditService, useValue: mockAuditService },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(mockJwtAuthGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/login', () => {
        it('should set HttpOnly cookies on successful login', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'test@example.com', password: 'password' })
                .expect(200)
                .expect((res) => {
                    const cookies = res.headers['set-cookie'];
                    expect(cookies).toBeDefined();

                    // Verify Access Token Cookie
                    const accessTokenCookie = cookies.find((c: string) => c.startsWith('access_token='));
                    expect(accessTokenCookie).toBeDefined();
                    expect(accessTokenCookie).toContain('HttpOnly');
                    expect(accessTokenCookie).toContain('Path=/');

                    // Verify Refresh Token Cookie
                    const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refresh_token='));
                    expect(refreshTokenCookie).toBeDefined();
                    expect(refreshTokenCookie).toContain('HttpOnly');
                    expect(refreshTokenCookie).toContain('Path=/api/v1/auth/refresh');

                    // Verify Body has no tokens
                    expect(res.body.accessToken).toBeUndefined();
                    expect(res.body.refreshToken).toBeUndefined();
                    expect(res.body.user).toBeDefined();
                });
        });
    });
});
