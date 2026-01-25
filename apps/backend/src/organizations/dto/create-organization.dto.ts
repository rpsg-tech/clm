/**
 * Create Organization DTO
 */

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

enum OrgType {
    PARENT = 'PARENT',
    ENTITY = 'ENTITY',
}

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty({ message: 'Organization name is required' })
    @MinLength(2, { message: 'Name must be at least 2 characters' })
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name: string;

    @IsString()
    @IsNotEmpty({ message: 'Organization code is required' })
    @Matches(/^[A-Z0-9_]{2,20}$/, {
        message: 'Code must be 2-20 uppercase letters, numbers, or underscores',
    })
    code: string;

    @IsOptional()
    @IsEnum(OrgType, { message: 'Type must be PARENT or ENTITY' })
    type?: OrgType;

    @IsOptional()
    @IsUUID('4', { message: 'Invalid parent organization ID' })
    parentId?: string;

    @IsOptional()
    settings?: Record<string, unknown>;
}
