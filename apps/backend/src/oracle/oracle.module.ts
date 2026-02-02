import { Module } from '@nestjs/common';
import { OracleController } from './oracle.controller';
import { OracleService } from './oracle.service';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
    imports: [ContractsModule],
    controllers: [OracleController],
    providers: [OracleService],
})
export class OracleModule { }
