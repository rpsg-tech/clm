
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateCategory } from '@prisma/client';

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
    fieldsConfig?: any[]; // JSON config for form fields if needed
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

    @IsBoolean()
    @IsOptional()
    isGlobal?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAnnexureDto)
    annexures: CreateAnnexureDto[];
}
