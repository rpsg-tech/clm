import { Injectable } from '@nestjs/common';
import { EmbeddingService } from '../embedding.interface';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenAIEmbeddingStrategy implements EmbeddingService {
    private openai: OpenAI;
    private modelName = 'text-embedding-3-small';

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const response = await this.openai.embeddings.create({
            model: this.modelName,
            input: text,
            encoding_format: 'float',
        });
        return response.data[0].embedding;
    }

    getModelVersion(): string {
        return `openai-${this.modelName}`;
    }
}
