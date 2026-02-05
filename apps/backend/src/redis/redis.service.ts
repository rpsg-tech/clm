/**
 * Redis Service
 * 
 * Provides Redis client for token blacklisting, caching, and rate limiting.
 * Enterprise-grade implementation with connection pooling and error handling.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis;
    private isConnected = false;

    // Key prefixes for different use cases
    private readonly KEY_PREFIX = {
        TOKEN_BLACKLIST: 'token:blacklist:',
        LOGIN_ATTEMPTS: 'login:attempts:',
        PASSWORD_RESET: 'password:reset:',
        RATE_LIMIT: 'rate:limit:',
        CACHE: 'cache:',
    };

    constructor(private configService: ConfigService) {
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

        this.client = new Redis(redisUrl, {
            retryStrategy: (times: number) => {
                if (times > 3) {
                    this.logger.warn('Redis connection failed, running without Redis');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000);
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
        });

        this.client.on('error', (error) => {
            this.logger.error(`Redis error: ${error.message}`);
            this.isConnected = false;
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            this.logger.log('✅ Redis connected');
        });

        this.client.on('close', () => {
            this.isConnected = false;
            this.logger.warn('Redis connection closed');
        });
    }

    async onModuleInit() {
        // Connection is established in constructor
    }

    async onModuleDestroy() {
        await this.client.quit();
        this.logger.log('Redis disconnected');
    }

    /**
     * Check if Redis is available
     */
    isAvailable(): boolean {
        return this.isConnected;
    }

    // ============ TOKEN BLACKLIST ============

    /**
     * Blacklist a JWT token by its JTI (JWT ID)
     * @param jti - JWT ID from the token payload
     * @param expiresInSeconds - TTL based on token's remaining lifetime
     */
    async blacklistToken(jti: string, expiresInSeconds: number): Promise<void> {
        if (!this.isConnected) {
            this.logger.warn('Redis unavailable - token blacklist skipped');
            return;
        }

        const key = `${this.KEY_PREFIX.TOKEN_BLACKLIST}${jti}`;
        await this.client.setex(key, expiresInSeconds, '1');
        this.logger.debug(`Token blacklisted: ${jti}`);
    }

    /**
     * Check if a token is blacklisted
     */
    async isTokenBlacklisted(jti: string): Promise<boolean> {
        if (!this.isConnected) {
            return false; // Fail open if Redis is unavailable
        }

        const key = `${this.KEY_PREFIX.TOKEN_BLACKLIST}${jti}`;
        const result = await this.client.get(key);
        return result !== null;
    }

    // ============ LOGIN ATTEMPTS (Account Lockout) ============

    /**
     * Increment failed login attempts for an email
     * @returns Current attempt count after increment
     */
    async incrementLoginAttempts(email: string): Promise<number> {
        if (!this.isConnected) {
            return 0;
        }

        const key = `${this.KEY_PREFIX.LOGIN_ATTEMPTS}${email.toLowerCase()}`;
        const attempts = await this.client.incr(key);

        // Set expiry on first attempt (15 minutes)
        if (attempts === 1) {
            await this.client.expire(key, 15 * 60);
        }

        return attempts;
    }

    /**
     * Get current failed login attempts
     */
    async getLoginAttempts(email: string): Promise<number> {
        if (!this.isConnected) {
            return 0;
        }

        const key = `${this.KEY_PREFIX.LOGIN_ATTEMPTS}${email.toLowerCase()}`;
        const attempts = await this.client.get(key);
        return attempts ? parseInt(attempts, 10) : 0;
    }

    /**
     * Reset login attempts after successful login
     */
    async resetLoginAttempts(email: string): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        const key = `${this.KEY_PREFIX.LOGIN_ATTEMPTS}${email.toLowerCase()}`;
        await this.client.del(key);
    }

    /**
     * Check if account is locked
     */
    async isAccountLocked(email: string, maxAttempts = 5): Promise<boolean> {
        const attempts = await this.getLoginAttempts(email);
        return attempts >= maxAttempts;
    }

    /**
     * Get remaining lockout time in seconds
     */
    async getLockoutTimeRemaining(email: string): Promise<number> {
        if (!this.isConnected) {
            return 0;
        }

        const key = `${this.KEY_PREFIX.LOGIN_ATTEMPTS}${email.toLowerCase()}`;
        const ttl = await this.client.ttl(key);
        return ttl > 0 ? ttl : 0;
    }

    // ============ PASSWORD RESET TOKENS ============

    /**
     * Store password reset token
     */
    async storePasswordResetToken(email: string, token: string, expiresInSeconds = 3600): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Redis unavailable - cannot store password reset token');
        }

        const key = `${this.KEY_PREFIX.PASSWORD_RESET}${token}`;
        await this.client.setex(key, expiresInSeconds, email.toLowerCase());
    }

    /**
     * Validate and consume password reset token
     * Returns email if valid, null if invalid/expired
     */
    async validatePasswordResetToken(token: string): Promise<string | null> {
        if (!this.isConnected) {
            return null;
        }

        const key = `${this.KEY_PREFIX.PASSWORD_RESET}${token}`;
        const email = await this.client.get(key);

        if (email) {
            // Consume token (one-time use)
            await this.client.del(key);
        }

        return email;
    }

    // ============ GENERIC CACHE ============

    /**
     * Set cache value
     */
    async setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (!this.isConnected) return;

        const cacheKey = `${this.KEY_PREFIX.CACHE}${key}`;
        if (ttlSeconds) {
            await this.client.setex(cacheKey, ttlSeconds, value);
        } else {
            await this.client.set(cacheKey, value);
        }
    }

    /**
     * Get cache value
     */
    async getCache(key: string): Promise<string | null> {
        if (!this.isConnected) return null;

        const cacheKey = `${this.KEY_PREFIX.CACHE}${key}`;
        return this.client.get(cacheKey);
    }

    /**
     * Delete cache value
     */
    async deleteCache(key: string): Promise<void> {
        if (!this.isConnected) return;

        const cacheKey = `${this.KEY_PREFIX.CACHE}${key}`;
        await this.client.del(cacheKey);
    }

    /**
     * Delete all cache keys matching a specific pattern
     * @param pattern - Pattern to match (e.g., 'user:123:*')
     * @returns Number of keys deleted
     */
    async deleteCachePattern(pattern: string): Promise<number> {
        if (!this.isConnected) return 0;

        const cachePattern = `${this.KEY_PREFIX.CACHE}${pattern}`;

        // Find keys matching the pattern
        const keys = await this.client.keys(cachePattern);

        if (keys.length > 0) {
            return this.client.del(...keys);
        }

        return 0;
    }

    /**
     * Get raw Redis client for advanced operations
     */
    getClient(): Redis {
        return this.client;
    }
}
