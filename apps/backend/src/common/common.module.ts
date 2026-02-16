import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email/email.service';
import { EmailProcessor } from './email/email.processor';
import { FeatureFlagService } from '../config/feature-flag.service';
import { OcrService } from './services/ocr.service';
import { DiffService } from './services/diff.service';

@Global()
@Module({
    imports: [
        BullModule.registerQueue({
            name: 'email',
        }),
    ],
    providers: [EmailService, EmailProcessor, FeatureFlagService, OcrService, DiffService],
    exports: [EmailService, FeatureFlagService, OcrService, BullModule, DiffService],
})
export class CommonModule { }
