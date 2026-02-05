import { Module } from '@nestjs/common';
import { OracleController } from './oracle.controller';
import { OracleService } from './oracle.service';
import { ContractsModule } from '../contracts/contracts.module';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RedisModule } from '../redis/redis.module';
import { OracleSecurityService } from './services/oracle-security.service';
import { OracleRouterService } from './services/oracle-router.service';
import { OracleRateLimiterService } from './services/oracle-rate-limiter.service';
import { OracleExecutorService } from './services/oracle-executor.service';

@Module({
    imports: [
        ContractsModule,
        AiModule,
        PrismaModule,
        AuditModule,
        RedisModule
    ],
    controllers: [OracleController],
    providers: [
        OracleService,
        OracleSecurityService,
        OracleRouterService,
        OracleRateLimiterService,
        OracleExecutorService
    ],
    exports: [OracleService]
})
export class OracleModule { }
