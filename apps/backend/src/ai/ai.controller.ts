/**
 * AI Controller
 * 
 * Endpoints for AI-powered contract analysis and suggestions.
 */

import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
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
        if (this.ocrService.isSupported('image/png') || this.ocrService.isSupported('image/jpeg')) {
            // Assume image if supported extension or just try? 
            // OcrService.extractText handles images. PDF handling might differ.
            // Using OcrService for now - assumes image. 
            // TODO: Add PDF text extraction support if needed.
            try {
                text = await this.ocrService.extractText(buffer);
            } catch (e) {
                // Ignore OCR error, maybe file is not image
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
