import { IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    search?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        lastPage: number;
        currentPage: number;
        perPage: number;
        prev: number | null;
        next: number | null;
    };
}
