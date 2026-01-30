import { Injectable } from '@nestjs/common';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { ThrottlerStorage } from '@nestjs/throttler/dist/throttler-storage.interface';
import { RedisService } from '../../redis/redis.service';

/**
 * Custom Redis Storage for Rate Limiting
 * Reuses the existing Redis connection to avoid overhead.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
    constructor(private readonly redisService: RedisService) { }

    async increment(
        key: string,
        ttl: number, // milliseconds in Throttler v6
        limit: number,
        blockDuration: number,
        throttlerName: string,
    ): Promise<ThrottlerStorageRecord> {
        const redis = this.redisService.getClient();
        const storageKey = `throttler:${key}`;

        // Lua script for atomic increment and expire
        // ARGV[1] = ttl (ms)
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

        // Execute script
        // Note: pttl returns -2 if key doesn't exist, -1 if no expiry
        const result = (await redis.eval(script, 1, storageKey, ttl)) as [number, number];
        const [hits, pttl] = result;

        return {
            totalHits: hits,
            timeToExpire: Math.max(0, pttl),
            isBlocked: false,
            timeToBlockExpire: 0,
        };
    }
}
