/**  
 * Enhanced Health Controller
 * 
 * Provides comprehensive health checks for:
 * - Liveness: Is the app running?
 * - Readiness: Can the app serve traffic?
 * - Deep: Detailed status of all dependencies
 * 
 * Used by:
 * - Load balancers
 * - Kubernetes/container orchestration
 * - Monitoring systems
 * - Operations teams
 */

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    responseTime?: number;
    message?: string;
}

@Controller('health')
export class HealthController {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
        private config: ConfigService,
    ) { }

    /**
     * Liveness probe - basic check that app is running
     * Returns 200 if process is alive
     */
    @Get('live')
    @HttpCode(HttpStatus.OK)
    liveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Readiness probe - can the app serve traffic?
     * Checks critical dependencies
     */
    @Get('ready')
    async readiness() {
        const checks: Record<string, HealthCheck> = {};

        // Database check (blocking)
        const dbHealth = await this.checkDatabase();
        checks.database = dbHealth;

        // Redis check (blocking)
        const redisHealth = await this.checkRedis();
        checks.redis = redisHealth;

        const allHealthy = Object.values(checks).every(c => c.status === 'healthy');
        const statusCode = allHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

        return {
            status: allHealthy ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString(),
            checks,
            statusCode,
        };
    }

    /**
     * Deep health check - detailed status of all components
     * Use for monitoring dashboards
     */
    @Get('deep')
    @HttpCode(HttpStatus.OK)
    async deep() {
        const checks: Record<string, HealthCheck> = {};

        // Parallel health checks for speed
        const [dbHealth, redisHealth] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
        ]);

        checks.database = dbHealth;
        checks.redis = redisHealth;

        // Check configuration
        checks.configuration = this.checkConfiguration();

        const healthyCount = Object.values(checks).filter(c => c.status === 'healthy').length;
        const totalChecks = Object.keys(checks).length;

        return {
            status: healthyCount === totalChecks ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: this.config.get('NODE_ENV', 'unknown'),
            checks,
            summary: {
                healthy: healthyCount,
                total: totalChecks,
                percentage: Math.round((healthyCount / totalChecks) * 100),
            },
        };
    }

    /**
     * Simple health endpoint (backward compatible)
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    // ========== Private Helper Methods ==========

    private async checkDatabase(): Promise<HealthCheck> {
        const start = Date.now();

        try {
            const result = await this.prisma.healthCheck();

            return {
                status: result.status === 'healthy' ? 'healthy' : 'unhealthy',
                responseTime: result.responseTime,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                message: error instanceof Error ? error.message : 'Database connection failed',
            };
        }
    }

    private async checkRedis(): Promise<HealthCheck> {
        const start = Date.now();

        try {
            // Simple Redis ping
            await this.redis.getClient().ping();

            return {
                status: 'healthy',
                responseTime: Date.now() - start,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
                message: error instanceof Error ? error.message : 'Redis connection failed',
            };
        }
    }

    private checkConfiguration(): HealthCheck {
        const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
        const missing = required.filter(key => !this.config.get(key));

        if (missing.length > 0) {
            return {
                status: 'degraded',
                message: `Missing configuration: ${missing.join(', ')}`,
            };
        }

        return {
            status: 'healthy',
        };
    }
}
