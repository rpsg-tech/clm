import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ContractStatus } from '@prisma/client';

export class GetContractsDto extends PaginationDto {
    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    expiringDays?: number;
}
