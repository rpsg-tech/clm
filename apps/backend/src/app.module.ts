/**
 * Root Application Module
 * 
 * Orchestrates all feature modules with proper configuration.
 */

import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { CorrelationMiddleware } from './common/middleware/correlation.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { IdempotencyMiddleware } from './common/middleware/idempotency.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { validateEnvironment } from './common/config/config.validation';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsModule } from './permissions/permissions.module';

// Domain Modules
import { ContractsModule } from './contracts/contracts.module';
import { TemplatesModule } from './templates/templates.module';
import { ApprovalsModule } from './approvals/approvals.module';

// Utility Modules
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SearchModule } from './search/search.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
    imports: [
        // Configuration with validation
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
            validate: validateEnvironment,
            validationOptions: {
                allowUnknown: true,
                abortEarly: false,
            },
        }),
        ScheduleModule.forRoot(),
        RedisModule,

        // Rate Limiting
        // Rate Limiting
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    name: 'default',
                    ttl: 60000, // 1 minute
                    limit: 1000, // 1000 requests per minute
                },
                {
                    name: 'strict',
                    ttl: 60000,
                    limit: 60, // 60 requests per minute for sensitive endpoints
                },
            ],
            errorMessage: 'Too many requests, please try again later.',
        }),

        // Core
        PrismaModule,
        AuthModule,
        UsersModule,
        OrganizationsModule,
        PermissionsModule,

        // Domain
        ContractsModule,
        TemplatesModule,
        ApprovalsModule,

        // Utility
        AuditModule,
        HealthModule,
        AiModule,
        AnalyticsModule,
        SearchModule,

        NotificationsModule,
        StorageModule,
    ],
    providers: [
        // Apply rate limiting globally
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(
                CorrelationMiddleware,
                RequestLoggerMiddleware,
                IdempotencyMiddleware,
                CsrfMiddleware
            )
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
