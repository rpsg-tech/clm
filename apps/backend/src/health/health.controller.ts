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

import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private memory: MemoryHealthIndicator,
        private prisma: PrismaService,
        private redis: RedisService,
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            // Database Check (Prisma)
            async () => {
                try {
                    await this.prisma.$queryRaw`SELECT 1`;
                    return { database: { status: 'up' } };
                } catch (e) {
                    const message = e instanceof Error ? e.message : 'Database check failed';
                    // Terminus expects an error thrown with the status object
                    throw new Error(JSON.stringify({ database: { status: 'down', message } }));
                }
            },

            // Redis Check
            async () => {
                try {
                    await this.redis.getClient().ping();
                    return { redis: { status: 'up' } };
                } catch (e) {
                    const message = e instanceof Error ? e.message : 'Redis check failed';
                    throw new Error(JSON.stringify({ redis: { status: 'down', message } }));
                }
            },

            // Memory Check (Heap > 150MB)
            () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        ]);
    }
}
