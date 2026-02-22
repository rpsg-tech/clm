
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateCategory } from '@prisma/client';

export class VariableMetaDto {
    @IsString()
    @IsNotEmpty()
    key: string; // e.g. "CLIENT_COMPANY_NAME"

    @IsString()
    @IsOptional()
    label?: string; // e.g. "Client Company Name"

    @IsString()
    @IsOptional()
    @IsIn(['text', 'number', 'date', 'textarea'])
    type?: string; // text | number | date | textarea

    @IsBoolean()
    @IsOptional()
    required?: boolean;

    @IsString()
    @IsOptional()
    placeholder?: string;
}

export class CreateAnnexureDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string; // HTML content

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariableMetaDto)
    fieldsConfig?: VariableMetaDto[]; // Variable metadata for this annexure
}

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsEnum(TemplateCategory)
    @IsNotEmpty()
    category: TemplateCategory;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    baseContent: string; // Main Agreement (Read-Only Part)

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariableMetaDto)
    variablesConfig?: VariableMetaDto[]; // Variable metadata for main contract

    @IsBoolean()
    @IsOptional()
    isGlobal?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAnnexureDto)
    annexures: CreateAnnexureDto[];
}
