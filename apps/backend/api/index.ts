import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

/**
 * Vercel Serverless Entry Point
 * 
 * Adapts NestJS application to run within Vercel's Serverless Function environment.
 * Caches the application instance across invocations for performance.
 */

let app: any;

export default async function handler(req: any, res: any) {
    if (!app) {
        app = await NestFactory.create(AppModule);
        app.setGlobalPrefix('api/v1');

        // Match main.ts configuration
        app.enableCors({
            origin: process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Idempotency-Key'],
        });

        await app.init();
    }

    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
}
