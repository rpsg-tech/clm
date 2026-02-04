import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CacheService } from '../common/cache/cache.service';

/**
 * Metrics Controller
 * Provides basic application metrics for monitoring
 */
@Controller('metrics')
export class MetricsController {
    constructor(private cacheService: CacheService) { }

    /**
     * Health check endpoint
     */
    @Get('health')
    @Public()
    async getHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }

    /**
     * Cache statistics
     */
    @Get('cache')
    @Public()
    async getCacheStats() {
        const stats = await this.cacheService.getStats();
        return {
            ...stats,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Basic system metrics  
     */
    @Get()
    @Public()
    async getMetrics() {
        const cacheStats = await this.cacheService.getStats();

        return {
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                timestamp: new Date().toISOString(),
            },
            cache: cacheStats,
            // Placeholders for future metrics
            requests: {
                total: 0,
                failed: 0,
                avgResponseTime: 0,
            },
        };
    }
}
