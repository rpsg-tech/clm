import { Controller, Get, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ExpiryScheduler } from './expiry.scheduler';
import { ConfigService } from '@nestjs/config';

@ApiTags('cron')
@Controller('cron')
export class ExpiryController {
    private readonly logger = new Logger(ExpiryController.name);

    constructor(
        private readonly expiryScheduler: ExpiryScheduler,
        private readonly configService: ConfigService,
    ) { }

    @Get('contract-expiry')
    @ApiOperation({ summary: 'Trigger contract expiry check (Cron Job)' })
    @ApiSecurity('cron-auth')
    async triggerExpiryCheck(@Headers('authorization') authHeader: string) {
        // Secure this endpoint
        const cronSecret = this.configService.get<string>('CRON_SECRET');

        // Vercel Cron sends "Bearer <CRON_SECRET>"
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            this.logger.warn(`Unauthorized cron access attempt`);
            throw new UnauthorizedException('Invalid cron secret');
        }

        this.logger.log('Received cron trigger for contract expiry');
        await this.expiryScheduler.handleContractExpiry();
        return { success: true, message: 'Expiry check completed' };
    }
}
