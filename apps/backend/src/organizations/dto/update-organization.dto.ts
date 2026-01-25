/**
 * Update Organization DTO
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizationDto } from './create-organization.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
