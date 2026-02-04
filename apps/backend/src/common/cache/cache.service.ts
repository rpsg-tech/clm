import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * Cache Service for Redis-based caching
 * Implements cache-aside pattern with automatic TTL management
 */
@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);

    constructor(private redis: RedisService) { }

    /**
     * Get cached value or compute and cache (cache-aside pattern)
     * @param key Cache key
     * @param fetchFn Function to fetch data on cache miss
     * @param ttlSeconds Time to live in seconds (default: 5 minutes)
     */
    async wrap<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttlSeconds: number = 300
    ): Promise<T> {
        const client = this.redis.getClient();

        try {
            // Try cache first
            const cached = await client.get(key);
            if (cached) {
                this.logger.debug(`Cache HIT: ${key}`);
                return JSON.parse(cached);
            }

            // Cache miss - fetch data
            this.logger.debug(`Cache MISS: ${key}`);
            const data = await fetchFn();

            // Store in cache (fire and forget to avoid blocking)
            client.setex(key, ttlSeconds, JSON.stringify(data)).catch(err =>
                this.logger.error(`Failed to cache key ${key}:`, err)
            );

            return data;
        } catch (error) {
            // On Redis error, fallback to fetching data directly
            this.logger.error(`Cache error for key ${key}:`, error);
            return fetchFn();
        }
    }

    /**
     * Invalidate cache key
     */
    async invalidate(key: string): Promise<void> {
        const client = this.redis.getClient();
        await client.del(key);
        this.logger.debug(`Cache invalidated: ${key}`);
    }

    /**
     * Invalidate keys matching pattern
     */
    async invalidatePattern(pattern: string): Promise<void> {
        const client = this.redis.getClient();
        const keys = await client.keys(pattern);

        if (keys.length > 0) {
            await client.del(...keys);
            this.logger.debug(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ hits: number; misses: number; hitRate: number }> {
        try {
            const client = this.redis.getClient();
            const info = await client.info('stats');

            const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
            const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
            const total = hits + misses;
            const hitRate = total > 0 ? (hits / total) * 100 : 0;

            return { hits, misses, hitRate };
        } catch (error) {
            this.logger.error('Failed to get cache stats:', error);
            return { hits: 0, misses: 0, hitRate: 0 };
        }
    }

    /**
     * Clear all cache keys (use with caution!)
     */
    async flush(): Promise<void> {
        const client = this.redis.getClient();
        await client.flushdb();
        this.logger.warn('Cache flushed - all keys deleted');
    }
}
