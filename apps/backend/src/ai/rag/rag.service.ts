import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingFactory } from '../embedding/embedding.factory';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractChunk, Prisma } from '@prisma/client';

@Injectable()
export class RagService {
    private readonly logger = new Logger(RagService.name);

    constructor(
        private embeddingFactory: EmbeddingFactory,
        private prisma: PrismaService,
    ) { }

    /**
     * Index a contract by chunking text and generating embeddings
     */
    async indexContract(contractId: string, content: string): Promise<void> {
        this.logger.log(`Indexing contract ${contractId}...`);

        // 1. Clear existing chunks
        await this.prisma.contractChunk.deleteMany({
            where: { contractId },
        });

        if (!content) return;

        // 2. Chunk Strategy: Split by "Clause" indicators or paragraphs
        // Simple heuristic: Split by double newlines or clause headers
        const chunks = this.splitIntoChunks(content);
        this.logger.log(`Generated ${chunks.length} chunks for contract ${contractId}`);

        // 3. Generate Embeddings & Save
        const embeddingService = this.embeddingFactory.getService();
        const modelVersion = embeddingService.getModelVersion();

        // Process in batches to avoid rate limits
        const BATCH_SIZE = 5;
        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (text) => {
                try {
                    const embedding = await embeddingService.generateEmbedding(text);

                    await this.prisma.contractChunk.create({
                        data: {
                            contractId,
                            content: text,
                            model_version: modelVersion,
                            // Prisma doesn't support vector writes natively yet without raw query or typed extensions
                            // However, unsupported types are tricky.
                            // We will insert without embedding first, then update with raw SQL?
                            // OR use $executeRaw for the insert.
                            // Using $executeRaw is safer for vector type.
                        }
                    });

                    // Workaround for Unsupported Type: Update with Raw SQL
                    // We can't easily retrieve the ID just created if we use create().
                    // BETTER STRATEGY: Use $executeRaw to INSERT directly.
                    await this.insertChunkWithVector(contractId, text, modelVersion, embedding);

                } catch (err) {
                    this.logger.error(`Failed to embed chunk in contract ${contractId}`, err);
                }
            }));
        }
    }

    private async insertChunkWithVector(
        contractId: string,
        content: string,
        modelVersion: string,
        embedding: number[]
    ) {
        const vectorString = `[${embedding.join(',')}]`;
        const id = crypto.randomUUID(); // Node 19+ or rely on import { v4 } from 'uuid'
        // Actually, let's let backend generate UUID or use PostgreSQL gen_random_uuid()

        await this.prisma.$executeRaw`
      INSERT INTO "ContractChunk" ("id", "contractId", "content", "model_version", "embedding", "updatedAt")
      VALUES (
        gen_random_uuid(), 
        ${contractId}, 
        ${content}, 
        ${modelVersion}, 
        ${vectorString}::vector,
        NOW()
      );
    `;
    }

    /**
     * Hybrid Search
     */
    async search(query: string, allowedContractIds: string[], limit = 5): Promise<(ContractChunk & { similarity: number })[]> {
        if (allowedContractIds.length === 0) return [];

        const embeddingService = this.embeddingFactory.getService();
        const queryEmbedding = await embeddingService.generateEmbedding(query);
        const vectorString = `[${queryEmbedding.join(',')}]`;
        const currentModelVersion = embeddingService.getModelVersion();

        // Use Prisma.join to strictly handle the IN clause for parameterized query
        const results = await this.prisma.$queryRaw<any[]>`
            SELECT 
                id, 
                "contractId", 
                content, 
                "model_version",
                "createdAt",
                "updatedAt",
                1 - (embedding <=> ${vectorString}::vector) as similarity
            FROM "ContractChunk"
            WHERE 
                "contractId" IN (${Prisma.join(allowedContractIds)})
                AND "model_version" = ${currentModelVersion}
            ORDER BY embedding <=> ${vectorString}::vector
            LIMIT ${limit};
        `;

        return results as (ContractChunk & { similarity: number })[];
    }

    private splitIntoChunks(text: string): string[] {
        // 1. Split by double newline (paragraphs)
        const paragraphs = text.split(/\n\s*\n/);

        // 2. Filter out empty or too short chunks
        return paragraphs
            .map(p => p.trim())
            .filter(p => p.length > 50); // Minimum 50 chars context
    }
}
