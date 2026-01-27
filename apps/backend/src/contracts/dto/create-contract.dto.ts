/**
 * Create Contract DTO
 */

import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEmail, IsObject, MaxLength, MinLength } from 'class-validator';

export class CreateContractDto {
    @IsUUID('4', { message: 'Invalid template ID' })
    @IsNotEmpty({ message: 'Template ID is required' })
    templateId: string;

    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
    title: string;

    @IsOptional()
    @IsString()
    @MaxLength(200, { message: 'Counterparty name cannot exceed 200 characters' })
    counterpartyName?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Invalid counterparty email' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    counterpartyEmail?: string;

    @IsOptional()
    @IsString()
    startDate?: string;

    @IsOptional()
    @IsString()
    endDate?: string;

    @IsOptional()
    amount?: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @IsNotEmpty({ message: 'Annexure data is required' })
    @MaxLength(5000000, { message: 'Annexure data cannot exceed 5MB' })
    annexureData: string;

    /**
     * Dynamic contract data based on the selected template.
     * TODO: Implement stricter schema validation using a custom validator
     * that checks against the Template's fieldsConfig.
     */
    @IsObject()
    @IsNotEmpty({ message: 'Field data is required' })
    fieldData: Record<string, unknown>;
}
