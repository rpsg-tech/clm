/**
 * Auth Service
 * 
 * Handles user authentication and token management.
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../common/email/email.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
    sub: string;      // User ID
    email: string;
    orgId?: string;   // Current organization context
    permissions?: string[];
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        organizations: Array<{
            id: string;
            name: string;
            code: string;
            role: string;
        }>;
        mustChangePassword: boolean;
    };
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private prisma: PrismaService,
        private redisService: RedisService,
        private emailService: EmailService,
    ) { }

    /**
     * Validate user credentials
     */
    async validateUser(email: string, password: string) {
        // Check if account is locked
        if (await this.redisService.isAccountLocked(email)) {
            const ttl = await this.redisService.getLockoutTimeRemaining(email);
            const minutes = Math.ceil(ttl / 60);
            throw new UnauthorizedException(
                `Account is locked. Please try again in ${minutes} minutes.`,
            );
        }

        const user = await this.usersService.findByEmail(email);

        if (!user) {
            // Record failed attempt
            await this.redisService.incrementLoginAttempts(email);
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            await this.redisService.incrementLoginAttempts(email);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Reset failed attempts on successful login
        await this.redisService.resetLoginAttempts(email);

        return user;
    }

    /**
     * Login and generate tokens
     */
    async login(loginDto: LoginDto): Promise<TokenResponse> {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        // Get user's organizations and roles with permissions
        const userOrgs = await this.prisma.userOrganizationRole.findMany({
            where: { userId: user.id, isActive: true },
            include: {
                organization: true,
                role: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                },
            },
        });

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Determine default organization
        // Prioritize SUPER_ADMIN and ENTITY_ADMIN roles to ensure admin access on login
        this.logger.log(`Found ${userOrgs.length} orgs for user ${user.email}`);
        userOrgs.forEach(uo => this.logger.log(`- Org: ${uo.organization.name}, Role: ${uo.role.code}`));

        const sortedOrgs = userOrgs.sort((a, b) => {
            const getScore = (roleCode: string) => {
                if (roleCode === 'SUPER_ADMIN') return 3;
                if (roleCode === 'ENTITY_ADMIN') return 2;
                if (roleCode === 'LEGAL_MANAGER') return 1;
                return 0;
            };
            return getScore(b.role.code) - getScore(a.role.code);
        });

        const defaultOrg = sortedOrgs[0] || null;
        this.logger.log(`Selected Default Org: ${defaultOrg?.organization.name} (${defaultOrg?.role.code})`);

        const defaultPermissions = defaultOrg
            ? defaultOrg.role.permissions.map(rp => rp.permission.code)
            : [];

        this.logger.log(`Permissions count: ${defaultPermissions.length}`);
        if (defaultPermissions.includes('admin:access')) {
            this.logger.log('User has admin:access');
        } else {
            this.logger.log('User MISSING admin:access');
        }

        // Generate tokens with unique JTI and Default Context
        const jti = nanoid();
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            orgId: defaultOrg?.organization.id,
            permissions: defaultPermissions,
        };

        const accessToken = this.jwtService.sign(payload, { jwtid: jti });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            jwtid: nanoid(),
        });

        this.logger.log(`User logged in: ${user.email} (Default Org: ${defaultOrg?.organization.name || 'None'})`);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                organizations: userOrgs.map((uo) => ({
                    id: uo.organization.id,
                    name: uo.organization.name,
                    code: uo.organization.code,
                    role: uo.role.code,
                })),
                mustChangePassword: user.mustChangePassword,
            },
        };
    }

    /**
     * Switch organization context
     */
    async switchOrganization(userId: string, organizationId: string) {
        // Verify user has access to the organization
        const userOrgRole = await this.prisma.userOrganizationRole.findFirst({
            where: {
                userId,
                organizationId,
                isActive: true,
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
                organization: true,
            },
        });

        if (!userOrgRole) {
            throw new UnauthorizedException('Access denied to this organization');
        }

        const permissions = userOrgRole.role.permissions.map(
            (rp) => rp.permission.code,
        );

        // Generate new token with org context
        const payload: JwtPayload = {
            sub: userId,
            email: '', // Will be populated from DB
            orgId: organizationId,
            permissions,
        };

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        payload.email = user?.email || '';

        const accessToken = this.jwtService.sign(payload, { jwtid: nanoid() });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
            jwtid: nanoid(),
        });

        return {
            accessToken,
            refreshToken, // Return new refresh token
            organization: {
                id: userOrgRole.organization.id,
                name: userOrgRole.organization.name,
                code: userOrgRole.organization.code,
            },
            role: userOrgRole.role.code,
            permissions,
        };
    }

    /**
     * Refresh access token
     */
    async refreshTokens(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });

            // Check if refresh token is blacklisted
            if (payload.jti) {
                const isBlacklisted = await this.redisService.isTokenBlacklisted(payload.jti);
                if (isBlacklisted) {
                    throw new UnauthorizedException('Session expired');
                }
            }

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Revoke old refresh token (Rotate)
            if (payload.jti && payload.exp) {
                const ttl = payload.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await this.redisService.blacklistToken(payload.jti, ttl);
                }
            }

            const newPayload: JwtPayload = {
                sub: user.id,
                email: user.email,
                orgId: payload.orgId,
                permissions: payload.permissions,
            };

            return {
                accessToken: this.jwtService.sign(newPayload, { jwtid: nanoid() }),
                refreshToken: this.jwtService.sign(newPayload, {
                    secret: this.configService.get('JWT_REFRESH_SECRET'),
                    expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
                    jwtid: nanoid(),
                }),
            };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Initiate password reset flow
     * 
     * SECURITY: Constant-time execution to prevent user enumeration via timing attacks.
     * Always takes approximately 200-300ms regardless of whether user exists.
     */
    async forgotPassword(email: string) {
        const startTime = Date.now();
        const constantTimeMs = 200; // Minimum execution time

        const user = await this.usersService.findByEmail(email);

        // Generate token and prepare email even if user doesn't exist
        const token = nanoid(32);
        const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
        const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

        if (user && user.isActive) {
            // Store in Redis (1 hour expiry)
            await this.redisService.storePasswordResetToken(email, token, 3600);

            // Send email
            await this.emailService.send({
                to: email,
                template: 'PASSWORD_RESET' as any,
                subject: 'Reset Your Password - CLM Enterprise',
                data: {
                    userName: user.name,
                    resetUrl,
                },
                priority: 'high',
            });
        }

        // Ensure constant execution time (defense against timing attacks)
        await this.ensureConstantTime(startTime, constantTimeMs);

        // Always return the same message (security best practice)
        return { message: 'If an account exists, a reset link has been sent.' };
    }

    /**
     * Helper: Ensure minimum execution time to prevent timing attacks
     */
    private async ensureConstantTime(startTime: number, minDurationMs: number): Promise<void> {
        const elapsed = Date.now() - startTime;
        const remaining = minDurationMs - elapsed;

        if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining));
        }
    }

    /**
     * Reset password using token
     */
    async resetPassword(token: string, newPassword: string) {
        // Validate token
        const email = await this.redisService.validatePasswordResetToken(token);

        if (!email) {
            throw new UnauthorizedException('Invalid or expired reset token');
        }

        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Update password
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(newPassword, salt);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                // Invalidate existing sessions
                lastLoginAt: new Date(),
            },
        });

        // Optional: Send confirmation email

        return { message: 'Password has been reset successfully' };
    }

    /**
     * Get user profile with current context
     */
    async getProfile(userId: string, orgId?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                mustChangePassword: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        let role: string | null = null;
        let permissions: string[] = [];
        let organization: any = null;

        if (orgId) {
            const userOrgRole = await this.prisma.userOrganizationRole.findUnique({
                where: {
                    userId_organizationId_roleId: {
                        userId,
                        organizationId: orgId,
                        roleId: (await this.prisma.userOrganizationRole.findFirst({
                            where: { userId, organizationId: orgId, isActive: true }
                        }))?.roleId || ''
                    }
                },
                include: {
                    organization: true,
                    role: {
                        include: {
                            permissions: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            });

            if (userOrgRole) {
                role = userOrgRole.role.code;
                permissions = userOrgRole.role.permissions.map(p => p.permission.code);
                organization = {
                    id: userOrgRole.organization.id,
                    name: userOrgRole.organization.name,
                    code: userOrgRole.organization.code,
                };
            }
        }

        // Get all available organizations
        const userOrgs = await this.prisma.userOrganizationRole.findMany({
            where: { userId, isActive: true },
            include: {
                organization: true,
                role: true,
            },
        });

        return {
            user: {
                ...user,
                organizations: userOrgs.map((uo) => ({
                    id: uo.organization.id,
                    name: uo.organization.name,
                    code: uo.organization.code,
                    role: uo.role.code,
                })),
            },
            currentOrg: organization,
            role,
            permissions,
        };
    }

    /**
     * Revoke a token (logout)
     */
    async revokeToken(jti: string, exp: number) {
        const ttl = exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
            await this.redisService.blacklistToken(jti, ttl);
        }
    }
}
