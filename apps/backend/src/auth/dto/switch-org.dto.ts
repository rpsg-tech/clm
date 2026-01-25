/**
 * Switch Organization DTO
 */

import { IsNotEmpty, IsUUID } from 'class-validator';

export class SwitchOrgDto {
    @IsUUID('4', { message: 'Invalid organization ID' })
    @IsNotEmpty({ message: 'Organization ID is required' })
    organizationId: string;
}
