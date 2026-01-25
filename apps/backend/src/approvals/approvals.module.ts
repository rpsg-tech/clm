/**
 * Approvals Module
 */

import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalsController } from './approvals.controller';

import { CommonModule } from '../common/common.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [CommonModule, NotificationsModule],
    controllers: [ApprovalsController],
    providers: [ApprovalsService],
    exports: [ApprovalsService],
})
export class ApprovalsModule { }
