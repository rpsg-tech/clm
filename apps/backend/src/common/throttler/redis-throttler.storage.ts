import { Injectable } from '@nestjs/common';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { ThrottlerStorage } from '@nestjs/throttler/dist/throttler-storage.interface';
import { RedisService } from '../../redis/redis.service';

/**
 * Custom Redis Storage for Rate Limiting
 * Falls back to in-memory storage when Redis is unavailable.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
    // In-memory fallback when Redis is unavailable
    private readonly memoryStore = new Map<string, { hits: number; expiresAt: number }>();

    constructor(private readonly redisService: RedisService) { }

    async increment(
        key: string,
        ttl: number, // milliseconds in Throttler v6
        limit: number,
        blockDuration: number,
        throttlerName: string,
    ): Promise<ThrottlerStorageRecord> {
        // Fallback to in-memory if Redis is not connected
        if (!this.redisService.isAvailable()) {
            return this.incrementMemory(key, ttl);
        }

        try {
            const redis = this.redisService.getClient();
            const storageKey = `throttler:${key}`;

            const script = `
                local key = KEYS[1]
                local ttl = tonumber(ARGV[1])
                local current = redis.call('INCR', key)
                
                if current == 1 then
                    redis.call('PEXPIRE', key, ttl)
                end
                
                local pttl = redis.call('PTTL', key)
                return {current, pttl}
            `;

            const result = (await redis.eval(script, 1, storageKey, ttl)) as [number, number];
            const [hits, pttl] = result;

            return {
                totalHits: hits,
                timeToExpire: Math.max(0, pttl),
                isBlocked: false,
                timeToBlockExpire: 0,
            };
        } catch {
            // Redis call failed mid-flight — fall back to memory
            return this.incrementMemory(key, ttl);
        }
    }

    private incrementMemory(key: string, ttl: number): ThrottlerStorageRecord {
        const now = Date.now();
        const entry = this.memoryStore.get(key);

        if (!entry || entry.expiresAt < now) {
            this.memoryStore.set(key, { hits: 1, expiresAt: now + ttl });
            return { totalHits: 1, timeToExpire: ttl, isBlocked: false, timeToBlockExpire: 0 };
        }

        entry.hits += 1;
        return {
            totalHits: entry.hits,
            timeToExpire: Math.max(0, entry.expiresAt - now),
            isBlocked: false,
            timeToBlockExpire: 0,
        };
    }
}
