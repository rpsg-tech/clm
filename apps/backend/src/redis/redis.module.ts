/**
 * Redis Module
 * 
 * Global module providing Redis service for token management and caching.
 */

import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule { }
