import { Module } from '@nestjs/common';
import { OracleController } from './oracle.controller';
import { OracleService } from './oracle.service';
import { ContractsModule } from '../contracts/contracts.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [ContractsModule, AiModule],
    controllers: [OracleController],
    providers: [OracleService],
})
export class OracleModule { }
