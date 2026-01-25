import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const correlationId = req.headers['x-correlation-id'] || nanoid();

        // Attach to request for logging
        (req as any)['correlationId'] = correlationId;

        // Attach to response header
        res.setHeader('X-Correlation-ID', correlationId);

        next();
    }
}
