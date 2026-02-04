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
        configService: ConfigService,
        private prisma: PrismaService,
        private redisService: RedisService,
    ) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET must be defined');
        }

        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: any) => {
                    return request?.cookies?.access_token;
                },
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: secret,
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
