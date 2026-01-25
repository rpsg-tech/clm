/**
 * Log Sanitizer Utility
 * 
 * Redacts sensitive information from logs to prevent data leaks.
 * Removes passwords, tokens, API keys, PII, credit cards, SSNs, etc.
 * 
 * Based on:
 * - OWASP Logging Cheat Sheet
 * - GDPR data protection requirements
 * - PCI-DSS logging standards
 * 
 * Usage:
 * ```typescript
 * import { sanitizeForLogging } from './log-sanitizer.util';
 * 
 * const data = { password: 'secret123', email: 'user@example.com' };
 * logger.log(sanitizeForLogging(data));
 * // Output: { password: '[REDACTED]', email: 'u***@example.com' }
 * ```
 */

/**
 * Sensitive field patterns to redact
 */
const SENSITIVE_FIELDS = [
    'password',
    'passwordHash',
    'newPassword',
    'oldPassword',
    'currentPassword',
    'token',
    'accessToken',
    'refreshToken',
    'resetToken',
    'apiKey',
    'api_key',
    'secret',
    'secretKey',
    'privateKey',
    'authorization',
    'auth',
    'cookie',
    'session',
    'csrf',
    'csrfToken',
    'jwt',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurity',
];

/**
 * Regex patterns for data in strings
 */
const PATTERNS = {
    // Credit card: 4111-1111-1111-1111 or 4111111111111111
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

    // Email: user@example.com -> u***@example.com
    email: /([a-zA-Z0-9._%+-])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,

    // JWT token: eyJ...
    jwt: /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,

    // API keys (common formats)
    apiKey: /[a-zA-Z0-9_-]{32,}/g,

    // SSN: 123-45-6789
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

    // Phone numbers: +1-234-567-8900
    phone: /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
};

/**
 * Sanitize object for logging
 * Removes or masks sensitive fields
 */
export function sanitizeForLogging(data: any, maxDepth = 5): any {
    if (maxDepth <= 0) {
        return '[MAX_DEPTH_EXCEEDED]';
    }

    // Handle null/undefined
    if (data === null || data === undefined) {
        return data;
    }

    // Handle primitives
    if (typeof data !== 'object') {
        return sanitizeString(String(data));
    }

    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeForLogging(item, maxDepth - 1));
    }

    // Handle objects
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase();

        // Check if field is sensitive
        if (SENSITIVE_FIELDS.some(field => keyLower.includes(field.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
            continue;
        }

        // Recursively sanitize nested objects/arrays
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeForLogging(value, maxDepth - 1);
        } else {
            // Sanitize string values
            sanitized[key] = typeof value === 'string' ? sanitizeString(value) : value;
        }
    }

    return sanitized;
}

/**
 * Sanitize string values
 * Masks emails, credit cards, tokens, etc.
 */
function sanitizeString(str: string): string {
    let sanitized = str;

    // Redact credit cards: 4111-1111-1111-1111 -> ****-****-****-1111
    sanitized = sanitized.replace(PATTERNS.creditCard, (match) => {
        const last4 = match.slice(-4);
        return `****-****-****-${last4}`;
    });

    // Mask emails: user@example.com -> u***@example.com
    sanitized = sanitized.replace(PATTERNS.email, (match, p1, p2) => {
        return `${p1}***@${p2}`;
    });

    // Redact JWT tokens
    sanitized = sanitized.replace(PATTERNS.jwt, '[JWT_REDACTED]');

    // Redact SSN
    sanitized = sanitized.replace(PATTERNS.ssn, '***-**-****');

    // Partially mask phone numbers: +1-234-567-8900 -> +1-***-***-8900
    sanitized = sanitized.replace(PATTERNS.phone, (match) => {
        const last4 = match.slice(-4);
        return `***-***-${last4}`;
    });

    return sanitized;
}

/**
 * Truncate long strings for logging
 * Prevents log flooding
 */
export function truncateForLogging(str: string, maxLength = 1000): string {
    if (str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength) + `... [TRUNCATED ${str.length - maxLength} chars]`;
}

/**
 * Sanitize error for logging
 * Removes sensitive data from error messages and stack traces
 */
export function sanitizeError(error: any): any {
    if (!error) {
        return error;
    }

    if (error instanceof Error) {
        return {
            name: error.name,
            message: sanitizeString(error.message),
            stack: error.stack ? sanitizeString(truncateForLogging(error.stack, 2000)) : undefined,
        };
    }

    return sanitizeForLogging(error);
}

/**
 * Create a sanitized logger wrapper
 * Use this to ensure all logs are sanitized
 */
export function createSanitizedLogger(logger: any) {
    return {
        log: (message: string, ...args: any[]) => {
            logger.log(sanitizeString(message), ...args.map(sanitizeForLogging));
        },
        error: (message: string, error?: any, ...args: any[]) => {
            logger.error(
                sanitizeString(message),
                error ? sanitizeError(error) : undefined,
                ...args.map(sanitizeForLogging)
            );
        },
        warn: (message: string, ...args: any[]) => {
            logger.warn(sanitizeString(message), ...args.map(sanitizeForLogging));
        },
        debug: (message: string, ...args: any[]) => {
            logger.debug(sanitizeString(message), ...args.map(sanitizeForLogging));
        },
        verbose: (message: string, ...args: any[]) => {
            logger.verbose(sanitizeString(message), ...args.map(sanitizeForLogging));
        },
    };
}
