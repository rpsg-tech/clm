import { Injectable, LoggerService, ConsoleLogger } from '@nestjs/common';

@Injectable()
export class AppLogger extends ConsoleLogger implements LoggerService {
    log(message: any, ...optionalParams: any[]) {
        this.printLog('log', message, ...optionalParams);
    }

    error(message: any, ...optionalParams: any[]) {
        this.printLog('error', message, ...optionalParams);
    }

    warn(message: any, ...optionalParams: any[]) {
        this.printLog('warn', message, ...optionalParams);
    }

    debug(message: any, ...optionalParams: any[]) {
        this.printLog('debug', message, ...optionalParams);
    }

    verbose(message: any, ...optionalParams: any[]) {
        this.printLog('verbose', message, ...optionalParams);
    }

    private printLog(level: string, message: any, ...optionalParams: any[]) {
        // In development, keep readable console output
        if (process.env.NODE_ENV !== 'production') {
            switch (level) {
                case 'log': super.log(message, ...optionalParams); break;
                case 'error': super.error(message, ...optionalParams); break;
                case 'warn': super.warn(message, ...optionalParams); break;
                case 'debug': super.debug(message, ...optionalParams); break;
                case 'verbose': super.verbose(message, ...optionalParams); break;
            }
            return;
        }

        // In production, use structured JSON
        const timestamp = new Date().toISOString();
        const context = optionalParams[optionalParams.length - 1]; // Usually context is last
        const traceId = this.extractTraceId(optionalParams);

        const logObject = {
            timestamp,
            level: level.toUpperCase(),
            context: typeof context === 'string' ? context : 'Application',
            message: typeof message === 'object' ? JSON.stringify(message) : message,
            traceId, // Correlation ID if passed
        };

        console.log(JSON.stringify(logObject));
    }

    private extractTraceId(params: any[]): string | undefined {
        // Look for string starting with "CorrelationID:" in params
        const traceParam = params.find(p => typeof p === 'string' && p.startsWith('CorrelationID:'));
        if (traceParam) {
            return traceParam.split(':')[1].trim();
        }
        return undefined;
    }
}
