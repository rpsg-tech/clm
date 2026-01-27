/**
 * Contracts Module
 */

import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ExpiryController } from './expiry.controller';

import { CommonModule } from '../common/common.module';

import { ExpiryScheduler } from './expiry.scheduler';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [CommonModule, NotificationsModule],
    controllers: [ContractsController, ExpiryController],
    providers: [ContractsService, ExpiryScheduler],
    exports: [ContractsService],
})
export class ContractsModule { }
