/**
 * AI Controller
 * 
 * Endpoints for AI-powered contract analysis and suggestions.
 */

import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { AiService, ContractAnalysis, ClauseSuggestion } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { OcrService } from '../common/services/ocr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('ai')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class AiController {
    private readonly logger = new Logger(AiController.name);
    constructor(
        private readonly aiService: AiService,
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly ocrService: OcrService,
    ) { }

    private async getAiConfig(orgId: string): Promise<any> {
        const feature = await this.prisma.featureFlag.findUnique({
            where: {
                organizationId_featureCode: {
                    organizationId: orgId,
                    featureCode: 'AI_CONTRACT_REVIEW'
                }
            }
        });
        return feature?.config || {};
    }

    /**
     * Analyze contract content
     */
    @Post('analyze')
    @Permissions('ai:analyze')
    async analyzeContract(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { content: string; title?: string },
    ) {
        if (!body.content || body.content.trim().length < 50) {
            throw new BadRequestException('Contract content must be at least 50 characters');
        }

        const config = await this.getAiConfig(user.orgId!);
        return this.aiService.analyzeContract(body.content, body.title, config);
    }

    /**
     * Get clause suggestions
     */
    @Post('suggest-clause')
    @Permissions('ai:chat')
    async suggestClause(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { clauseType: string; context?: string },
    ) {
        if (!body.clauseType) {
            throw new BadRequestException('Clause type is required');
        }

        const config = await this.getAiConfig(user.orgId!);
        return this.aiService.suggestClauses(body.context || '', body.clauseType, config);
    }

    /**
     * Improve an existing clause
     */
    @Post('improve-clause')
    @Permissions('contract:edit')
    async improveClause(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { clause: string }
    ): Promise<{ original: string; improved: string; changes: string[] }> {
        if (!body.clause || body.clause.trim().length < 20) {
            throw new BadRequestException('Clause must be at least 20 characters');
        }

        const config = await this.getAiConfig(user.orgId!);
        return this.aiService.improveClause(body.clause, config);
    }

    /**
     * Document Chat (Sidebar Co-pilot)
     */
    @Post('chat-document')
    @Permissions('ai:chat')
    async chatDocument(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { query: string; content: string }
    ) {
        if (!body.query) throw new BadRequestException('Query is required');
        if (!body.content) throw new BadRequestException('Document content is required');

        const config = await this.getAiConfig(user.orgId!);
        const response = await this.aiService.chatDocument(body.query, body.content, config);

        return { content: response };
    }

    /**
     * Extract expiry date from text
     */
    @Post('extract-date')
    @Permissions('contract:create')
    async extractDate(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { content: string }
    ) {
        if (!body.content || body.content.trim().length < 20) {
            throw new BadRequestException('Content must be at least 20 characters');
        }

        const config = await this.getAiConfig(user.orgId!);
        return this.aiService.extractExpiryDate(body.content, config);
    }

    /**
     * Get Upload URL for AI Analysis (Temporary)
     */
    @Post('upload-url')
    @Permissions('contract:create')
    async getUploadUrl(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { filename: string; contentType: string }
    ) {
        return this.storageService.getUploadUrl(
            `temp/${user.orgId}/ai-analysis`,
            body.filename,
            body.contentType,
            900 // 15 mins expiry
        );
    }

    /**
     * Analyze uploaded file (OCR + AI)
     */
    @Post('analyze-file')
    @Permissions('contract:create')
    async analyzeFile(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { key: string }
    ) {
        if (!body.key) {
            throw new BadRequestException('File key is required');
        }

        // 1. Get file buffer
        const buffer = await this.storageService.getFile(body.key);

        // 2. OCR Extraction
        let text = '';
        // Basic mime type detection from key or header would be better, but assuming extension from key
        const key = body.key;
        const ext = key.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === 'pdf') mimeType = 'application/pdf';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';


        if (this.ocrService.isSupported(mimeType)) {
            try {
                this.logger.log(`Processing OCR for file key: ${key}, mime: ${mimeType}`);
                text = await this.ocrService.extractText(buffer, mimeType);
            } catch (e) {
                this.logger.error(`OCR failed: ${(e as Error).message}`);
                // Ignore OCR error, proceed
            }
        }

        // Fallback or if empty text?
        // If buffer can be converted to string (e.g. text file)
        if (!text && buffer.length < 100000) {
            text = buffer.toString('utf-8');
        }

        if (!text || text.trim().length < 20) {
            throw new BadRequestException('Could not extract text from file');
        }

        // 3. AI Analysis
        const config = await this.getAiConfig(user.orgId!);
        return this.aiService.extractExpiryDate(text, config);
    }

    /**
     * Get available clause types for suggestions
     */
    @Get('clause-types')
    @Permissions('contract:view')
    getClauseTypes(): { types: string[] } {
        return {
            types: [
                'termination',
                'liability',
                'confidentiality',
                'payment',
                'indemnification',
                'intellectual_property',
                'dispute_resolution',
                'force_majeure',
                'warranty',
                'assignment',
            ],
        };
    }
}
