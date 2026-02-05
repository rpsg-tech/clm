/**
 * Oracle Rate Limiter Service
 * 
 * Redis-based rate limiting per tier to control AI costs
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export interface RateLimitConfig {
    tier: 1 | 2 | 3;
    limit: number;
    window: number; // seconds
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    tier: number;
}

@Injectable()
export class OracleRateLimiterService {
    private readonly logger = new Logger(OracleRateLimiterService.name);

    private readonly TIER_LIMITS: Record<number, { daily: number; hourly?: number }> = {
        1: { daily: 100 }, // Pattern matching - generous
        2: { daily: 50, hourly: 20 }, // AI function calling - moderate
        3: { daily: 20, hourly: 5 }   // Full AI - strict
    };

    constructor(private redisService: RedisService) { }

    /**
     * Check if user can make a query at given tier
     */
    async checkLimit(userId: string, tier: 1 | 2 | 3): Promise<RateLimitResult> {
        if (!this.redisService.isAvailable()) {
            // Graceful degradation: allow if Redis unavailable
            this.logger.warn('Redis unavailable - rate limiting disabled');
            return {
                allowed: true,
                remaining: -1,
                resetAt: new Date(),
                tier
            };
        }

        const limits = this.TIER_LIMITS[tier];

        // Check daily limit
        const dailyKey = `oracle:limit:daily:${tier}:${userId}`;
        const dailyCount = await this.redisService.getClient().incr(dailyKey);

        if (dailyCount === 1) {
            // First query today - set expiry
            await this.redisService.getClient().expire(dailyKey, 86400); // 24 hours
        }

        if (dailyCount > limits.daily) {
            const ttl = await this.redisService.getClient().ttl(dailyKey);
            const resetAt = new Date(Date.now() + ttl * 1000);

            this.logger.warn(`User ${userId} exceeded Tier ${tier} daily limit: ${dailyCount}/${limits.daily}`);

            return {
                allowed: false,
                remaining: 0,
                resetAt,
                tier
            };
        }

        // Check hourly limit if applicable (Tier 2 & 3)
        if (limits.hourly) {
            const hourlyKey = `oracle:limit:hourly:${tier}:${userId}`;
            const hourlyCount = await this.redisService.getClient().incr(hourlyKey);

            if (hourlyCount === 1) {
                await this.redisService.getClient().expire(hourlyKey, 3600); // 1 hour
            }

            if (hourlyCount > limits.hourly) {
                const ttl = await this.redisService.getClient().ttl(hourlyKey);
                const resetAt = new Date(Date.now() + ttl * 1000);

                this.logger.warn(`User ${userId} exceeded Tier ${tier} hourly limit: ${hourlyCount}/${limits.hourly}`);

                return {
                    allowed: false,
                    remaining: 0,
                    resetAt,
                    tier
                };
            }
        }

        return {
            allowed: true,
            remaining: limits.daily - dailyCount,
            resetAt: new Date(Date.now() + 86400000),
            tier
        };
    }

    /**
     * Get current usage for user across all tiers
     */
    async getUsage(userId: string): Promise<Record<number, { used: number; limit: number }>> {
        // Return zero usage if Redis unavailable
        if (!this.redisService.isAvailable()) {
            this.logger.warn('Redis unavailable - returning zero usage');
            return {
                1: { used: 0, limit: this.TIER_LIMITS[1].daily },
                2: { used: 0, limit: this.TIER_LIMITS[2].daily },
                3: { used: 0, limit: this.TIER_LIMITS[3].daily }
            };
        }

        const usage: Record<number, { used: number; limit: number }> = {};

        for (const tier of [1, 2, 3]) {
            const key = `oracle:limit:daily:${tier}:${userId}`;
            const used = await this.redisService.getClient().get(key);

            usage[tier] = {
                used: used ? parseInt(used) : 0,
                limit: this.TIER_LIMITS[tier].daily
            };
        }

        return usage;
    }

    /**
     * Check and throw if limit exceeded
     */
    async enforceLimit(userId: string, tier: 1 | 2 | 3): Promise<void> {
        const result = await this.checkLimit(userId, tier);

        if (!result.allowed) {
            const hours = Math.ceil((result.resetAt.getTime() - Date.now()) / 3600000);
            throw new BadRequestException(
                `You've reached your ${tier === 3 ? 'advanced AI' : tier === 2 ? 'AI-powered' : 'query'} ` +
                `limit for today (${this.TIER_LIMITS[tier].daily} queries/day). ` +
                `Limit resets in ${hours} hour${hours > 1 ? 's' : ''}.`
            );
        }
    }
}
