import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { Contract, ContractAnalysis, ContractStatus } from '@prisma/client';

@Injectable()
export class ContractAnalysisService {
    private readonly logger = new Logger(ContractAnalysisService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly aiService: AiService,
    ) { }

    /**
     * Analyze a contract for risks and missing clauses.
     * Uses Caching: If contract hasn't changed since last analysis, returns cached result.
     * Uses GPT-4o-mini for cost efficiency.
     */
    async analyzeContract(contractId: string, userId: string): Promise<ContractAnalysis> {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                analyses: {
                    orderBy: { analyzedAt: 'desc' },
                    take: 1,
                },
                template: true,
                attachments: true // Fetch annexures if needed later (Phase 2 enhancement)
            },
        });

        if (!contract) {
            throw new NotFoundException(`Contract with ID ${contractId} not found`);
        }

        // 1. CACHING CHECK
        // If analysis exists AND is newer than the contract update, return it.
        const existingAnalysis = contract.analyses[0];
        if (existingAnalysis && existingAnalysis.analyzedAt > contract.updatedAt) {
            this.logger.log(`Using cached analysis for contract ${contractId}`);
            return existingAnalysis;
        }

        this.logger.log(`Starting fresh analysis for contract ${contractId} (Model: gpt-4o-mini)`);

        // 2. DATA PREPARATION
        // Clean text to save tokens
        const cleanedContent = this.cleanText(contract.content);

        let context = `
CONTRACT TITLE: ${contract.title}
TYPE: ${contract.template.name}
STATUS: ${contract.status}
REFERENCE: ${contract.reference}

--- START OF MAIN AGREEMENT ---
${cleanedContent}
--- END OF MAIN AGREEMENT ---
`;

        // Append Annexure Data if available (Text)
        if (contract.annexureData && contract.annexureData.length > 10) {
            context += `
--- ANNEXURE DATA ---
${this.cleanText(contract.annexureData)}
--- END ANNEXURE ---
`;
        }

        // 3. AI PROCESSING (Cost Optimized: gpt-4o-mini)
        const systemPrompt = `You are a Senior Legal Risk Auditor.
TASK: Analyze the provided contract text for risks and missing clauses.

OUTPUT JSON FORMAT:
{
  "riskScore": number (1-10),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "keyTerms": [ { "term": "string", "category": "string", "importance": "HIGH"|"MEDIUM" } ],
  "issues": [ { "severity": "CRITICAL"|"WARNING", "title": "string", "description": "string", "clause": "string" } ],
  "suggestions": ["string"],
  "summary": "string"
}

CRITICAL RULES:
- Identify key clauses extracted from text.
- Flag MISSING standard clauses (e.g. Confidentiality, Termination, Force Majeure).
- Assess Risk based on one-sided terms or uncapped liabilities.
- Be concise.`;

        try {
            // Using OpenAI directly for structured JSON output if available, or text parsing
            // Assuming aiService.chat or similar method accepts model override
            // Note: AiService.analyzeContract returns fixed structure, adapting here to use generic chat for JSON

            // We'll use the existing analyzeContract but override model
            // However, analyzeContract signature returns a specific interface. 
            // Let's use it directly if it matches our schema

            const analysisResult = await this.aiService.analyzeContract(context, contract.title, {
                provider: 'openai',
                model: 'gpt-4o-mini'
            });

            // 4. PERSISTENCE
            const savedAnalysis = await this.prisma.contractAnalysis.create({
                data: {
                    contractId: contract.id,
                    riskScore: analysisResult.riskScore,
                    riskLevel: analysisResult.riskLevel,
                    keyTerms: analysisResult.keyTerms as any,
                    issues: analysisResult.issues as any,
                    suggestions: analysisResult.suggestions as any,
                    summary: analysisResult.summary,
                    analyzedBy: userId,
                    analyzedAt: new Date(),
                },
            });

            return savedAnalysis;

        } catch (error: any) {
            this.logger.error(`Analysis failed for contract ${contractId}: ${error.message}`);
            throw error;
        }
    }

    private cleanText(text: string): string {
        if (!text) return '';
        return text
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable chars (optional)
            .trim();
    }
}
