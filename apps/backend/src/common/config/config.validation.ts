/**
 * Environment Configuration Validation
 * 
 * Validates all required environment variables at application startup.
 * Fails fast with clear error messages if configuration is invalid.
 * 
 * Based on:
 * - NestJS Configuration Best Practices
 * - 12-Factor App Methodology
 * - OWASP Secure Configuration Guide
 */

import { plainToClass } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsUrl,
    IsInt,
    IsBoolean,
    IsIn,
    MinLength,
    Max,
    Min,
    validateSync,
    IsOptional,
} from 'class-validator';

export class EnvironmentVariables {
    // ============ Server Configuration ============

    @IsIn(['development', 'staging', 'production'])
    NODE_ENV: string = 'development';

    @IsInt()
    @Min(1024)
    @Max(65535)
    PORT: number = 3001;

    @IsUrl({ require_tld: false })
    @IsNotEmpty()
    FRONTEND_URL: string;

    // ============ Database ============

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    DATABASE_URL: string;

    // ============ Redis ============

    @IsString()
    @IsNotEmpty()
    REDIS_URL: string;

    // ============ JWT Authentication ============

    @IsString()
    @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters for security' })
    @IsNotEmpty()
    JWT_SECRET: string;

    @IsString()
    @IsOptional()
    JWT_EXPIRES_IN?: string = '15m';

    @IsString()
    @MinLength(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' })
    @IsNotEmpty()
    JWT_REFRESH_SECRET: string;

    @IsString()
    @IsOptional()
    JWT_REFRESH_EXPIRES_IN?: string = '7d';

    // ============ CORS ============

    @IsString()
    @IsNotEmpty()
    CORS_ORIGINS: string;

    // ============ Email Service ============

    @IsString()
    @IsOptional()
    SMTP_HOST?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(65535)
    SMTP_PORT?: number = 587;

    @IsBoolean()
    @IsOptional()
    SMTP_SECURE?: boolean = false;

    @IsString()
    @IsOptional()
    SMTP_USER?: string;

    @IsString()
    @IsOptional()
    SMTP_PASS?: string;

    @IsEmail()
    @IsOptional()
    EMAIL_FROM?: string = 'noreply@clm-enterprise.com';

    @IsString()
    @IsOptional()
    EMAIL_FROM_NAME?: string = 'CLM Enterprise';

    // ============ Optional: AI Features ============

    @IsString()
    @IsOptional()
    GEMINI_API_KEY?: string;

    // ============ Optional: AWS S3 ============

    @IsString()
    @IsOptional()
    AWS_ACCESS_KEY_ID?: string;

    @IsString()
    @IsOptional()
    AWS_SECRET_ACCESS_KEY?: string;

    @IsString()
    @IsOptional()
    AWS_REGION?: string;

    @IsString()
    @IsOptional()
    AWS_S3_BUCKET?: string;
}

/**
 * Validate environment variables and return typed configuration
 * 
 * @throws Error if validation fails with detailed error messages
 */
export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
    // Convert string values to appropriate types
    const validatedConfig = plainToClass(EnvironmentVariables, {
        ...config,
        PORT: config.PORT ? parseInt(config.PORT as string, 10) : 3001,
        SMTP_PORT: config.SMTP_PORT ? parseInt(config.SMTP_PORT as string, 10) : 587,
        SMTP_SECURE: config.SMTP_SECURE === 'true',
    });

    // Validate
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
        whitelist: true,
        forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
        const errorMessages = errors
            .map((error) => {
                const constraints = error.constraints || {};
                return `  - ${error.property}: ${Object.values(constraints).join(', ')}`;
            })
            .join('\n');

        throw new Error(
            `❌ Environment configuration validation failed:\n\n${errorMessages}\n\n` +
            `Please check your .env file and ensure all required variables are set correctly.\n` +
            `See .env.example for reference.`
        );
    }

    // Additional cross-field validations
    validateProductionRequirements(validatedConfig);
    validateSecurityConstraints(validatedConfig);
    validateCorsOrigins(validatedConfig.CORS_ORIGINS);

    return validatedConfig;
}

/**
 * Validate production-specific requirements
 */
function validateProductionRequirements(config: EnvironmentVariables): void {
    if (config.NODE_ENV === 'production') {
        // Ensure SMTP is configured in production
        const requiredSmtpFields = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
        const missingSmtp = requiredSmtpFields.filter(field => !config[field as keyof EnvironmentVariables]);

        if (missingSmtp.length > 0) {
            throw new Error(
                `❌ Production environment requires SMTP configuration.\n` +
                `Missing: ${missingSmtp.join(', ')}\n` +
                `Email notifications will not work without proper SMTP setup.`
            );
        }

        // Ensure DATABASE_URL has connection pooling configured
        if (!config.DATABASE_URL.includes('connection_limit=')) {
            console.warn(
                '⚠️  WARNING: DATABASE_URL does not specify connection_limit parameter.\n' +
                '   This may cause connection pool exhaustion under load.\n' +
                '   Recommended: Add "?connection_limit=20" to your DATABASE_URL'
            );
        }
    }
}

/**
 * Validate security constraints
 */
function validateSecurityConstraints(config: EnvironmentVariables): void {
    // Ensure JWT secrets are different
    if (config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
        throw new Error(
            '❌ Security Error: JWT_SECRET and JWT_REFRESH_SECRET must be different.\n' +
            'Using the same secret for both tokens reduces security.'
        );
    }

    // Warn about weak secrets in production
    if (config.NODE_ENV === 'production') {
        const weakPatterns = [
            'secret', 'password', 'test', 'demo', 'example',
            '12345', 'qwerty', 'admin', 'changeme'
        ];

        const secretLower = config.JWT_SECRET.toLowerCase();
        const hasWeakPattern = weakPatterns.some(pattern => secretLower.includes(pattern));

        if (hasWeakPattern) {
            throw new Error(
                '❌ Security Error: JWT_SECRET appears to contain weak or common patterns.\n' +
                'Please use a cryptographically random secret in production.\n' +
                'Generate one using: openssl rand -base64 32'
            );
        }
    }
}

/**
 * Validate CORS origins format
 */
function validateCorsOrigins(corsOrigins: string): void {
    const origins = corsOrigins.split(',').map(o => o.trim());

    for (const origin of origins) {
        // Allow localhost for development
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            continue;
        }

        // Require HTTPS in production-like origins
        if (!origin.startsWith('https://') && !origin.startsWith('http://localhost')) {
            console.warn(
                `⚠️  WARNING: CORS origin "${origin}" does not use HTTPS.\n` +
                '   This is acceptable for development but not recommended for production.'
            );
        }

        // Validate URL format
        try {
            new URL(origin);
        } catch {
            throw new Error(
                `❌ Invalid CORS origin: "${origin}"\n` +
                'CORS_ORIGINS must be a comma-separated list of valid URLs.'
            );
        }
    }
}

/**
 * Get typed configuration (for use in services)
 */
export function getTypedConfig(config: Record<string, unknown>): EnvironmentVariables {
    return validateEnvironment(config);
}
