/**
 * Organizations Module
 */

import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { FeatureFlagsController } from './feature-flags.controller';

@Module({
    controllers: [OrganizationsController, FeatureFlagsController],
    providers: [OrganizationsService],
    exports: [OrganizationsService],
})
export class OrganizationsModule { }
