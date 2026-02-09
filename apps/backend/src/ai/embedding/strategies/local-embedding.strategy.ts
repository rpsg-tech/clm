import { Injectable, OnModuleInit } from '@nestjs/common';
import { EmbeddingService } from '../embedding.interface';

@Injectable()
export class LocalEmbeddingStrategy implements EmbeddingService, OnModuleInit {
    private pipeline: any;
    private modelName = 'Xenova/all-MiniLM-L6-v2';

    async onModuleInit() {
        // Dynamic import to handle ESM/CJS compatibility if needed, or just import top-level
        // @xenova/transformers is ESM only, so dynamic import is often safer in NestJS/TS-Node envs
        const { pipeline } = await import('@xenova/transformers');
        this.pipeline = await pipeline('feature-extraction', this.modelName);
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.pipeline) await this.onModuleInit();

        // Generate embedding
        // pooling: 'mean' averages token embeddings to get sentence embedding
        // normalize: true ensures cosine similarity works via dot product
        const result = await this.pipeline(text, { pooling: 'mean', normalize: true });
        return Array.from(result.data);
    }

    getModelVersion(): string {
        return `local-${this.modelName}`;
    }
}
