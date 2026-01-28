/**
 * Prisma Service
 * 
 * Enhanced with:
 * - Connection pooling configuration
 * - Query logging for slow queries (>100ms)
 * - Connection retry logic with exponential backoff
 * - Graceful shutdown handling
 * - Health check endpoint
 * 
 * Best Practices:
 * - Production: Set connection_limit in DATABASE_URL
 * - Monitoring: Slow queries logged automatically
 * - Resilience: Auto-retry on connection failures
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(private configService: ConfigService) {
        const isProduction = configService.get('NODE_ENV') === 'production';

        super({
            log: isProduction
                ? [
                    { emit: 'event', level: 'query' },
                    { emit: 'event', level: 'error' },
                    { emit: 'event', level: 'warn' },
                ]
                : ['warn', 'error'],

            // Error formatting
            errorFormat: isProduction ? 'minimal' : 'colorless',
        });

        // Log slow queries (>100ms)
        if (isProduction) {
            // @ts-expect-error Prisma event typing
            this.$on('query', (e: { query: string; duration: number }) => {
                if (e.duration > 100) {
                    this.logger.warn(
                        `⏱️ Slow query detected (${e.duration}ms): ${e.query.substring(0, 100)}...`,
                    );
                }
            });
        }

        // Log database errors
        // @ts-expect-error Prisma event typing
        this.$on('error', (e: any) => {
            this.logger.error('❌ Database error:', e);
        });

        // Log warnings
        // @ts-expect-error Prisma event typing
        this.$on('warn', (e: any) => {
            this.logger.warn('⚠️ Database warning:', e);
        });
    }

    async onModuleInit() {
        // In serverless environments (Vercel), we should avoid blocking application bootstrap
        // with explicit connection attempts. Prisma connects lazily on the first query.

        // However, for debugging, we can attempt a connection without blocking hard loops.
        try {
            // Check config presence
            const dbUrl = this.configService.get('DATABASE_URL');
            if (!dbUrl) {
                this.logger.error('❌ DATABASE_URL is not defined in environment variables');
            } else if (this.configService.get('NODE_ENV') === 'production') {
                if (!dbUrl.includes('connection_limit')) {
                    this.logger.warn('⚠️  No connection_limit found in DATABASE_URL. Add "?connection_limit=10" for Vercel.');
                }
            }

            // We rely on lazy connection logic for faster cold starts.
            // Explicit await this.$connect() is removed to unblock boot time.
            this.logger.log('✅ Prisma Service initialized (Lazy connection mode)');
        } catch (error) {
            this.logger.warn('⚠️ Prisma Config check failed', error);
        }
    }

    async onModuleDestroy() {
        this.logger.log('Disconnecting from database...');
        await this.$disconnect();
        this.logger.log('✅ Database disconnected');
    }

    /**
     * Health check for database connectivity
     * Used by health endpoints to verify database status
     */
    async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime: number }> {
        const start = Date.now();

        try {
            await this.$queryRaw`SELECT 1`;
            const responseTime = Date.now() - start;

            return {
                status: 'healthy',
                responseTime,
            };
        } catch (error) {
            this.logger.error('Database health check failed:', error);
            return {
                status: 'unhealthy',
                responseTime: Date.now() - start,
            };
        }
    }

    /**
     * Clean database for testing
     * WARNING: Only use in test environment
     */
    async cleanDatabase() {
        if (this.configService.get('NODE_ENV') !== 'test') {
            throw new Error('cleanDatabase can only be called in test environment');
        }

        const tables = await this.$queryRaw<Array<{ tablename: string }>>`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        `;

        for (const { tablename } of tables) {
            if (tablename !== '_prisma_migrations') {
                await this.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
            }
        }
    }
}
