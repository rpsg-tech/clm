/**
 * AI Controller
 * 
 * Endpoints for AI-powered contract analysis and suggestions.
 */

import { Controller, Post, Get, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { AiService, ContractAnalysis, ClauseSuggestion } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    /**
     * Analyze contract content
     */
    @Post('analyze')
    @Permissions('contract:view')
    async analyzeContract(
        @Body() body: { content: string; title?: string }
    ): Promise<ContractAnalysis> {
        if (!body.content || body.content.trim().length < 50) {
            throw new BadRequestException('Contract content must be at least 50 characters');
        }
        return this.aiService.analyzeContract(body.content, body.title);
    }

    /**
     * Get clause suggestions
     */
    @Post('suggest-clause')
    @Permissions('contract:create', 'contract:edit')
    async suggestClause(
        @Body() body: { context: string; clauseType: string }
    ): Promise<ClauseSuggestion[]> {
        if (!body.clauseType) {
            throw new BadRequestException('Clause type is required');
        }
        return this.aiService.suggestClauses(body.context || '', body.clauseType);
    }

    /**
     * Improve an existing clause
     */
    @Post('improve-clause')
    @Permissions('contract:edit')
    async improveClause(
        @Body() body: { clause: string }
    ): Promise<{ original: string; improved: string; changes: string[] }> {
        if (!body.clause || body.clause.trim().length < 20) {
            throw new BadRequestException('Clause must be at least 20 characters');
        }
        return this.aiService.improveClause(body.clause);
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
