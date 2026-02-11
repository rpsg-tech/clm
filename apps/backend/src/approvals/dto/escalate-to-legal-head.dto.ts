import { IsString, IsOptional } from 'class-validator';

export class EscalateToLegalHeadDto {
    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
