/**
 * Organizations Module
 */

import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagService } from '../config/feature-flag.service';

@Module({
    controllers: [OrganizationsController, FeatureFlagsController],
    providers: [OrganizationsService, FeatureFlagService],
    exports: [OrganizationsService, FeatureFlagService],
})
export class OrganizationsModule { }
