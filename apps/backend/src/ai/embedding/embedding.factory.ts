import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.interface';
import { OpenAIEmbeddingStrategy } from './strategies/openai-embedding.strategy';
import { LocalEmbeddingStrategy } from './strategies/local-embedding.strategy';

@Injectable()
export class EmbeddingFactory {
    constructor(
        private configService: ConfigService,
        private openaiStrategy: OpenAIEmbeddingStrategy,
        private localStrategy: LocalEmbeddingStrategy,
    ) { }

    getService(): EmbeddingService {
        const provider = this.configService.get<string>('EMBEDDING_PROVIDER', 'openai');

        if (provider === 'local') {
            return this.localStrategy;
        }
        return this.openaiStrategy;
    }
}
