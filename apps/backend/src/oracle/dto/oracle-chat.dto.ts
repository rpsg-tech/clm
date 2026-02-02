import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class OracleChatRequestDto {
    @IsNotEmpty()
    @IsString()
    query: string;

    @IsOptional()
    @IsString()
    // @IsUrl() - strict URL validation might fail for internal routes, keeping as string for relative paths
    contextUrl?: string;

    @IsOptional()
    @IsString()
    organizationId?: string;
}

export class OracleContext {
    userId: string;
    userRole: string;
    organizationId: string;
    allowedContractIds: string[];
}
