/**
 * CSRF Protection Middleware
 * 
 * Implements double-submit cookie pattern for CSRF protection.
 * 
 * How it works:
 * 1. On first request, generate a CSRF token and set it as a cookie
 * 2. Frontend must read the cookie and send token in X-CSRF-Token header
 * 3. Middleware validates that cookie and header match
 * 
 * Based on:
 * - OWASP CSRF Prevention Cheat Sheet
 * - Double-Submit Cookie Pattern
 * - SameSite cookie attribute for additional protection
 *
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    private readonly logger = new Logger(CsrfMiddleware.name);

    use(req: Request, res: Response, next: NextFunction) {
        // Skip CSRF for safe methods (idempotent, no state change)
        if (SAFE_METHODS.includes(req.method)) {
            // Ensure CSRF token cookie is set for future requests
            this.ensureCsrfCookie(req, res);
            return next();
        }

        // Skip for specific paths that don't need CSRF (e.g., public webhooks)
        const skipPaths = ['/api/v1/health', '/api/v1/webhooks'];
        if (skipPaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        // For state-changing requests, validate CSRF token
        const cookieToken = req.cookies[CSRF_COOKIE_NAME];
        const headerToken = req.headers[CSRF_HEADER_NAME] as string;

        // Both must exist
        if (!cookieToken || !headerToken) {
            throw new ForbiddenException(
                'CSRF token missing. Please include X-CSRF-Token header with the value from XSRF-TOKEN cookie.'
            );
        }

        // Tokens must match (double-submit validation)
        if (cookieToken !== headerToken) {
            throw new ForbiddenException('CSRF token mismatch. Possible CSRF attack detected.');
        }

        // Token should be valid format (basic check)
        if (!this.validateTokenFormat(headerToken)) {
            throw new ForbiddenException('Invalid CSRF token format.');
        }

        // All checks passed
        next();
    }

    /**
     * Ensure CSRF cookie is set on the response
     */
    /**
     * Ensure CSRF cookie is set on the response
     */
    private ensureCsrfCookie(req: Request, res: Response): void {
        const existingToken = req.cookies[CSRF_COOKIE_NAME];

        if (!existingToken || !this.validateTokenFormat(existingToken)) {
            const newToken = this.generateToken();

            res.cookie(CSRF_COOKIE_NAME, newToken, {
                httpOnly: false, // Must be readable by JavaScript
                secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                sameSite: 'strict', // Strong CSRF protection
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                path: '/',
            });
        }
    }

    /**
     * Generate cryptographically random CSRF token
     */
    private generateToken(): string {
        return randomBytes(16).toString('hex'); // 16 bytes = 32 hex characters
    }

    /**
     * Validate token format
     */
    private validateTokenFormat(token: string): boolean {
        // Hex tokens are alphanumeric, length 32
        return /^[a-f0-9]{32}$/i.test(token);
    }
}
