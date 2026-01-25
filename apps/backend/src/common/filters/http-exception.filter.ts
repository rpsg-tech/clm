import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { sanitizeForLogging, sanitizeError } from '../utils/log-sanitizer.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const statusCode =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        const correlationId = (request as any)['correlationId'];

        // Log the error with sanitization
        const logContext = {
            correlationId,
            method: request.method,
            url: request.url,
            statusCode,
            message: typeof message === 'object' ? sanitizeForLogging(message) : message,
        };

        if (statusCode >= 500) {
            this.logger.error(
                `Server Error: ${JSON.stringify(logContext)}`,
                sanitizeError(exception)
            );
        } else {
            this.logger.warn(`Client Error: ${JSON.stringify(logContext)}`);
        }

        const msgContent = typeof message === 'object' && message !== null && 'message' in message
            ? (message as any).message
            : message;

        response.status(statusCode).json({
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: msgContent,
            correlationId,
        });
    }
}
