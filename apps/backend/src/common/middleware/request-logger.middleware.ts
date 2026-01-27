import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl } = req;
        const start = Date.now();
        const correlationId = (req as any)['correlationId'] || 'unknown';

        // Log when the request finishes
        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - start;
            const userAgent = req.get('user-agent') || '';
            const ip = req.ip;

            const logMessage = `${method} ${originalUrl} ${statusCode} ${duration}ms - ${userAgent} ${ip}`;

            // Re-use CorrelationID format for AppLogger to pick up
            const traceMeta = `CorrelationID: ${correlationId}`;

            if (statusCode >= 500) {
                this.logger.error(logMessage, traceMeta);
            } else if (statusCode >= 400) {
                this.logger.warn(logMessage, traceMeta);
            } else {
                this.logger.log(logMessage, traceMeta);
            }
        });

        next();
    }
}
