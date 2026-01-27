/**
 * Idempotency Middleware
 * 
 * Prevents duplicate processing of requests due to network retries.
 * Uses Redis to track request deduplication based on idempotency key.
 * 
 * How it works:
 * 1. Client sends `Idempotency-Key` header (UUID recommended)
 * 2. Server checks Redis for previous response
 * 3. If found: return cached response
 * 4. If not found: process request, cache response for 24 hours
 * 
 * Based on Stripe's idempotency implementation:
 * https://stripe.com/docs/api/idempotent_requests
 * 
 * Usage:
 * - Apply to POST/PUT/PATCH/DELETE endpoints
 * - Especially important for financial transactions, approvals, contract creation
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../redis/redis.service';
import { createHash } from 'crypto';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';
const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours in seconds

interface CachedResponse {
    status: number;
    headers: Record<string, string>;
    body: any;
    timestamp: string;
}

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
    private readonly logger = new Logger(IdempotencyMiddleware.name);

    constructor(private redis: RedisService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Only apply to state-changing methods
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            return next();
        }

        // Skip for specific paths
        const skipPaths = ['/api/v1/health', '/api/v1/webhooks'];
        if (skipPaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER] as string;

        // If no idempotency key provided, proceed normally
        // (optional - could enforce it for certain routes)
        if (!idempotencyKey) {
            this.logger.debug(`No idempotency key for ${req.method} ${req.path}`);
            return next();
        }

        // Validate key format (should be UUID or similar)
        if (!this.isValidKey(idempotencyKey)) {
            return res.status(400).json({
                error: 'Invalid idempotency key format. Use a UUID or unique string.',
            });
        }

        // Create unique cache key including method, path, and body hash
        const cacheKey = this.generateCacheKey(req, idempotencyKey);

        try {
            // Check if we've seen this request before
            const cachedValue = await this.redis.getClient().get(cacheKey);

            if (cachedValue) {
                const cachedResponse: CachedResponse = JSON.parse(cachedValue);
                this.logger.log(
                    `Idempotent request detected: ${req.method} ${req.path} (key: ${idempotencyKey})`
                );

                // Return cached response
                res.status(cachedResponse.status);
                Object.entries(cachedResponse.headers).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
                res.setHeader('X-Idempotent-Replay', 'true');
                return res.json(cachedResponse.body);
            }

            // Capture the response for caching
            const originalJson = res.json.bind(res);
            const originalSend = res.send.bind(res);


            const cacheResponse = async (body: any) => {
                // Only cache successful responses (2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const responseToCache: CachedResponse = {
                        status: res.statusCode,
                        headers: this.getResponseHeaders(res),
                        body,
                        timestamp: new Date().toISOString(),
                    };

                    await this.redis.getClient().setex(
                        cacheKey,
                        IDEMPOTENCY_TTL,
                        JSON.stringify(responseToCache)
                    );

                    this.logger.debug(
                        `Cached idempotent response: ${req.method} ${req.path} (key: ${idempotencyKey})`
                    );
                }
            };

            // Override res.json to cache response
            res.json = (body: any) => {
                cacheResponse(body).catch(err =>
                    this.logger.error('Failed to cache idempotent response:', err)
                );
                return originalJson(body);
            };

            // Override res.send to cache response
            res.send = (body: any) => {
                cacheResponse(body).catch(err =>
                    this.logger.error('Failed to cache idempotent response:', err)
                );
                return originalSend(body);
            };

            next();
        } catch (error) {
            // If Redis fails, log error but don't block request
            this.logger.error('Idempotency middleware error:', error);
            next();
        }
    }

    /**
     * Generate cache key from request
     */
    private generateCacheKey(req: Request, idempotencyKey: string): string {
        // Include method, path, and body hash to ensure exact request match
        const bodyHash = this.hashBody(req.body);
        return `idempotency:${req.method}:${req.path}:${idempotencyKey}:${bodyHash}`;
    }

    /**
     * Hash request body for cache key
     */
    private hashBody(body: any): string {
        if (!body || Object.keys(body).length === 0) {
            return 'nobody';
        }
        const bodyString = JSON.stringify(body);
        return createHash('sha256').update(bodyString).digest('hex').substring(0, 16);
    }

    /**
     * Validate idempotency key format
     */
    private isValidKey(key: string): boolean {
        // Accept UUIDs or alphanumeric strings (min 16 chars, max 64 chars)
        return /^[a-zA-Z0-9_-]{16,64}$/.test(key);
    }

    /**
     * Extract relevant response headers for caching
     */
    private getResponseHeaders(res: Response): Record<string, string> {
        const headers: Record<string, string> = {};
        const relevantHeaders = ['content-type', 'x-correlation-id'];

        relevantHeaders.forEach(header => {
            const value = res.getHeader(header);
            if (value) {
                headers[header] = value.toString();
            }
        });

        return headers;
    }
}
