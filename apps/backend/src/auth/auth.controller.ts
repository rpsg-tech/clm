/**
 * Auth Controller
 * 
 * Handles authentication endpoints with audit logging.
 */

import {
    Controller,
    Get,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
    Res,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SwitchOrgDto } from './dto/switch-org.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import { Prisma } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly auditService: AuditService,
    ) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getProfile(@Request() req: { user: AuthenticatedUser }) {
        // Return current user context
        return this.authService.getProfile(req.user.id, req.user.orgId);
    }

    /**
     * Login with email and password
     * Sets access_token and refresh_token as HttpOnly cookies
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ strict: { ttl: 60000, limit: 5 } })
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.login(loginDto);

        // Set Cookies
        this.setCookies(response, result.accessToken, result.refreshToken);

        // Operations Audit Log
        await this.auditService.log({
            userId: result.user.id,
            action: AuditService.Actions.USER_LOGIN,
            module: 'auth',
            targetType: 'User',
            targetId: result.user.id,
            metadata: {
                email: result.user.email,
                organizationsCount: result.user.organizations.length,
            } as Prisma.InputJsonValue,
        });

        // Return user info only (no tokens in body)
        return { user: result.user };
    }

    /**
     * Request password reset
     */
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ strict: { ttl: 60000, limit: 3 } })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto.email);
    }

    /**
     * Reset password
     */
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ strict: { ttl: 60000, limit: 3 } })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(
            resetPasswordDto.token,
            resetPasswordDto.password,
        );
    }

    /**
     * Refresh access token using refresh token cookie
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @Throttle({ strict: { ttl: 60000, limit: 10 } })
    async refreshToken(
        @Req() request: ExpressRequest,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = request.cookies['refresh_token'];
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        const result = await this.authService.refreshTokens(refreshToken);

        this.setCookies(response, result.accessToken, result.refreshToken);

        return { message: 'Tokens refreshed' };
    }

    /**
     * Switch to a different organization context
     */
    @Post('switch-org')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async switchOrganization(
        @Request() req: { user: { id: string } },
        @Body() switchOrgDto: SwitchOrgDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.switchOrganization(
            req.user.id,
            switchOrgDto.organizationId,
        );

        this.setCookies(response, result.accessToken, result.refreshToken);

        // Audit log org switch
        await this.auditService.log({
            organizationId: switchOrgDto.organizationId,
            userId: req.user.id,
            action: AuditService.Actions.ORG_SWITCHED,
            module: 'auth',
            targetType: 'Organization',
            targetId: switchOrgDto.organizationId,
            metadata: {
                newOrgId: switchOrgDto.organizationId,
            } as Prisma.InputJsonValue,
        });

        // Return new context info (excluding token)
        return {
            organization: result.organization,
            role: result.role,
            permissions: result.permissions,
        };
    }

    /**
     * Logout (Revoke access token and clear cookies)
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async logout(
        @Request() req: { user: { id: string; jti: string; exp: number } },
        @Res({ passthrough: true }) response: Response,
    ) {
        if (req.user.jti && req.user.exp) {
            await this.authService.revokeToken(req.user.jti, req.user.exp);
        }

        // Clear Cookies
        response.clearCookie('access_token');
        response.clearCookie('refresh_token');

        // Audit log logout
        await this.auditService.log({
            userId: req.user.id,
            action: AuditService.Actions.USER_LOGOUT,
            module: 'auth',
            targetType: 'User',
            targetId: req.user.id,
        });

        return { message: 'Logged out successfully' };
    }

    private setCookies(response: Response, accessToken: string, refreshToken?: string) {
        const isProd = process.env.NODE_ENV === 'production';

        response.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax', // Allow nav from same site
            path: '/',
            maxAge: 15 * 60 * 1000, // 15 mins
        });

        if (refreshToken) {
            response.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: 'lax',
                path: '/api/v1/auth/refresh', // Restrict to refresh endpoint
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
        }
    }
}
