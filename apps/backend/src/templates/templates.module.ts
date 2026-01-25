/**
 * Templates Module
 */

import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { AdminTemplatesController } from './admin-templates.controller';

@Module({
    controllers: [TemplatesController, AdminTemplatesController],
    providers: [TemplatesService],
    exports: [TemplatesService],
})
export class TemplatesModule { }
