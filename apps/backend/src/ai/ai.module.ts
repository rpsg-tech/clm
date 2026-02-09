/**
 * AI Module
 */

import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { EmbeddingFactory } from './embedding/embedding.factory';
import { OpenAIEmbeddingStrategy } from './embedding/strategies/openai-embedding.strategy';
import { LocalEmbeddingStrategy } from './embedding/strategies/local-embedding.strategy';
import { RagService } from './rag/rag.service';

@Module({
    controllers: [AiController],
    providers: [
        AiService,
        EmbeddingFactory,
        OpenAIEmbeddingStrategy,
        LocalEmbeddingStrategy,
        RagService
    ],
    exports: [
        AiService,
        EmbeddingFactory,
        RagService
    ],
})
export class AiModule { }
