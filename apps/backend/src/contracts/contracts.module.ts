/**
 * Contracts Module
 */

import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ExpiryController } from './expiry.controller';

// Specialized Services
import { ContractWorkflowService } from './services/contract-workflow.service';
import { ContractNotificationService } from './services/contract-notification.service';
import { ContractStorageService } from './services/contract-storage.service';
import { ContractVersionService } from './services/contract-version.service';

import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module'; // Added PrismaModule import

import { ExpiryScheduler } from './expiry.scheduler';

import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';
import { ConfigModule } from '@nestjs/config';
import { FeatureFlagService } from '../config/feature-flag.service';

import { AiModule } from '../ai/ai.module';
import { ContractAnalysisService } from './analysis/contract-analysis.service';

@Module({
    imports: [PrismaModule, CommonModule, NotificationsModule, AuditModule, ConfigModule, AiModule],
    controllers: [ContractsController, ExpiryController],
    providers: [
        ContractsService,
        ContractAnalysisService,
        ExpiryScheduler,
        FeatureFlagService,
        // Specialized services
        ContractWorkflowService,
        ContractNotificationService,
        ContractStorageService,
        ContractVersionService,
    ],
    exports: [ContractsService],
})
export class ContractsModule { }
