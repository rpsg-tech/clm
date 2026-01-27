/**
 * CLM Enterprise Platform - Backend Entry Point
 * 
 * Production-ready NestJS application with:
 * - Security headers (Helmet)
 * - CORS configuration
 * - Global validation pipes
 * - Rate limiting
 * - Compression
 * - Swagger API documentation
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './common/logger/logger.service';

/**
 * Validate CORS origins at startup
 */
function validateCorsOrigins(origins: string[]) {
    const logger = new Logger('CORS');

    origins.forEach(origin => {
        if (!origin) return;

        // Allow localhost for development  
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return;
        }

        // Validate URL format
        try {
            new URL(origin);

            // Warn about non-HTTPS in production
            if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) {
                logger.warn(`⚠️  CORS origin "${origin}" is not HTTPS. This is insecure for production.`);
            }
        } catch {
            throw new Error(`Invalid CORS origin: "${origin}". Must be a valid URL.`);
        }
    });

    logger.log(`✅ CORS origins validated: ${origins.join(', ')}`);
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new AppLogger(),
    });
    const logger = new Logger('Bootstrap'); // Or use app.get(AppLogger) if registered globally, but Logger wrapper is fine for bootstrap
    const configService = app.get(ConfigService);

    // ============ SECURITY ============

    // Helmet security headers
    app.use(helmet());

    // Cookie Parser
    app.use(cookieParser());

    // CORS Configuration with validation
    const corsOrigins = configService.get('CORS_ORIGINS', '').split(',').map((o: string) => o.trim());

    // Validate CORS origins at startup
    validateCorsOrigins(corsOrigins);

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Idempotency-Key'],
    });

    // ============ VALIDATION ============

    // Global validation pipe with strict settings
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,              // Strip unknown properties
            forbidNonWhitelisted: true,   // Throw on unknown properties
            transform: true,              // Auto-transform payloads to DTO types
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // ============ PERFORMANCE ============



    // Compression for responses
    app.use(compression());

    // ============ GLOBAL FILTERS ============

    app.useGlobalFilters(new HttpExceptionFilter());

    // ============ GLOBAL MIDDLEWARE ============

    // Add API Version Header
    app.use((req: any, res: any, next: any) => {
        res.setHeader('X-Api-Version', '1.0.0');
        next();
    });

    // ============ API PREFIX ============

    app.setGlobalPrefix('api/v1');

    // ============ SWAGGER API DOCS ============

    if (configService.get('NODE_ENV', 'development') !== 'production') {
        const swaggerConfig = new DocumentBuilder()
            .setTitle('CLM Enterprise API')
            .setDescription('Contract Lifecycle Management Enterprise Platform API Documentation')
            .setVersion('1.0')
            .addBearerAuth(
                { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                'JWT-auth',
            )
            .addApiKey(
                { type: 'apiKey', name: 'X-Organization-Id', in: 'header' },
                'org-context',
            )
            .addTag('auth', 'Authentication endpoints')
            .addTag('contracts', 'Contract management')
            .addTag('templates', 'Template governance')
            .addTag('approvals', 'Approval workflow')
            .addTag('ai', 'AI-powered features')
            .addTag('analytics', 'Dashboard analytics')
            .addTag('organizations', 'Organization management')
            .addTag('users', 'User management')
            .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });

        logger.log('📚 Swagger docs available at http://localhost:3001/api/docs');
    }

    // ============ START SERVER ============

    const port = configService.get<number>('PORT', 3001);
    await app.listen(port);

    logger.log(`🚀 CLM Enterprise API running on http://localhost:${port}/api/v1`);
    logger.log(`📊 Environment: ${configService.get('NODE_ENV', 'development')}`);

    // ============ GRACEFUL SHUTDOWN ============
    const gracefulShutdown = async (signal: string) => {
        logger.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);

        try {
            // Close the NestJS app (triggers all onModuleDestroy hooks)
            await app.close();
            logger.log('✅ Application closed successfully');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();

