/**
 * JWT Strategy
 * 
 * Validates JWT tokens and extracts user information.
 * Checks token against Redis blacklist for revocation support.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth.service';
import { RedisService } from '../../redis/redis.service';
import { UserStatus } from '@prisma/client';

export interface AuthenticatedUser {
    id: string;
    email: string;
    orgId?: string;
    permissions: string[];
    jti?: string; // Token ID
    exp?: number; // Expiration timestamp
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private redisService: RedisService,
    ) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET must be defined in environment variables');
        }

        const jwtFromRequest = ExtractJwt.fromExtractors([
            // 1. From Authorization Bearer header
            ExtractJwt.fromAuthHeaderAsBearerToken(),
            // 2. From cookie (direct or forwarded from proxy)
            (request: any) => {
                let token = null;
                if (request && request.cookies) {
                    // Direct cookie access (when client sends directly to backend)
                    token = request.cookies['token'] || request.cookies['access_token'];
                }
                if (!token && request && request.headers && request.headers.cookie) {
                    // Parse forwarded Cookie header from Next.js proxy
                    const cookies = request.headers.cookie.split(';');
                    const tokenCookie = cookies.find(c => c.trim().startsWith('token=') || c.trim().startsWith('access_token='));
                    if (tokenCookie) {
                        token = tokenCookie.split('=')[1];
                    }
                }
                return token;
            },
        ]);

        super({
            jwtFromRequest,
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: false,
        });
    }

    async validate(payload: JwtPayload & { jti?: string; exp?: number }): Promise<AuthenticatedUser> {
        // SECURITY: Enforce JTI presence for all tokens (required for revocation)
        if (!payload.jti) {
            throw new UnauthorizedException('Invalid token format: missing token ID');
        }

        // Check if token is blacklisted (revoked)
        const isBlacklisted = await this.redisService.isTokenBlacklisted(payload.jti);
        if (isBlacklisted) {
            throw new UnauthorizedException('Token has been revoked');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, isActive: true, status: true },
        });

        if (!user || !user.isActive || user.status === UserStatus.INACTIVE || user.status === UserStatus.PENDING_APPROVAL) {
            throw new UnauthorizedException('User not found, inactive, or pending approval');
        }

        return {
            id: payload.sub,
            email: payload.email,
            orgId: payload.orgId,
            permissions: payload.permissions || [],
            jti: payload.jti,
            exp: payload.exp,
        };
    }
}
