import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface ContractAnalysis {
    riskScore: number; // 1-10
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    keyTerms: KeyTerm[];
    issues: Issue[];
    suggestions: string[];
    summary: string;
}

export interface KeyTerm {
    term: string;
    value: string;
    category: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Issue {
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    title: string;
    description: string;
    clause?: string;
    recommendation: string;
}

export interface ClauseSuggestion {
    title: string;
    content: string;
    category: string;
    confidence: number;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    private readonly useMock: boolean;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        const forceMock = this.configService.get<string>('AI_MOCK_MODE') === 'true';

        if (apiKey && !forceMock) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            this.useMock = false;
            this.logger.log('✅ AI Service initialized with Gemini API');
        } else {
            this.useMock = true;
            this.logger.log('⚠️ AI Service running in MOCK mode (missing key or forced mock)');
        }
    }

    /**
     * Analyze a contract
     */
    async analyzeContract(content: string, title?: string): Promise<ContractAnalysis> {
        this.logger.log(`Analyzing contract: ${title || 'Untitled'}`);

        if (this.useMock || !this.model) {
            return this.mockAnalyze(content);
        }

        try {
            const prompt = `
                Analyze the following legal contract and provide a JSON response with:
                1. riskScore (1-10 integer)
                2. riskLevel (LOW/MEDIUM/HIGH)
                3. keyTerms (array of objects with term, value, category, importance)
                4. issues (array of objects with severity, title, description, recommendation)
                5. suggestions (array of strings)
                6. summary (concise summary string)

                Contract Content:
                "${content.substring(0, 30000)}" // Truncate to avoid token limits if excessively large
            `;

            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Extract JSON from response (handle potential markdown formatting)
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr) as ContractAnalysis;

        } catch (error) {
            this.logger.error(`AI Analysis failed: ${error}`);
            return this.mockAnalyze(content); // Fallback to mock on error
        }
    }

    /**
     * Suggest clauses based on context
     */
    async suggestClauses(context: string, clauseType: string): Promise<ClauseSuggestion[]> {
        if (this.useMock || !this.model) {
            return this.mockSuggestClauses(clauseType);
        }

        try {
            const prompt = `
                Generate 2-3 standard legal clauses for type "${clauseType}".
                Context: "${context}"
                Return a JSON array of objects with: title, content, category, confidence (0-1).
            `;

            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

            return JSON.parse(jsonStr) as ClauseSuggestion[];
        } catch (error) {
            this.logger.error(`AI Suggestions failed: ${error}`);
            return this.mockSuggestClauses(clauseType);
        }
    }

    /**
     * Improve an existing clause
     */
    async improveClause(clause: string): Promise<{ original: string; improved: string; changes: string[] }> {
        if (this.useMock || !this.model) {
            return this.mockImproveClause(clause);
        }

        try {
            const prompt = `
                Improve this legal clause for clarity, risk mitigation, and professionalism.
                Clause: "${clause}"
                Return JSON with: original (string), improved (string), changes (array of strings describing edits).
            `;

            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();

            return JSON.parse(jsonStr);
        } catch (error) {
            this.logger.error(`AI Improvement failed: ${error}`);
            return this.mockImproveClause(clause);
        }
    }

    // ============ MOCK METHODS ============

    private async mockAnalyze(content: string): Promise<ContractAnalysis> {
        await this.simulateDelay(1000);

        const contentLower = content.toLowerCase();
        const issues: Issue[] = [];
        const keyTerms: KeyTerm[] = [];

        // Simple keyword-based mock analysis
        if (!contentLower.includes('termination')) {
            issues.push({
                severity: 'WARNING',
                title: 'Missing Termination Clause',
                description: 'No explicit termination clause found.',
                recommendation: 'Add standard termination provisions.',
            });
        }
        if (!contentLower.includes('liability')) {
            issues.push({
                severity: 'CRITICAL',
                title: 'Missing Liability Terms',
                description: 'No liability limitations found.',
                recommendation: 'Add liability caps and indemnification.',
            });
        }

        keyTerms.push(
            { term: 'Effective Date', value: 'Upon Signature', category: 'Dates', importance: 'HIGH' },
            { term: 'Jurisdiction', value: 'Not specified', category: 'Legal', importance: 'MEDIUM' },
        );

        return {
            riskScore: issues.length * 2 + 1,
            riskLevel: issues.length > 2 ? 'HIGH' : issues.length > 0 ? 'MEDIUM' : 'LOW',
            keyTerms,
            issues,
            suggestions: ['Review liability terms', 'Check termination periods'],
            summary: 'Mock analysis completed. System is running in demo mode.',
        };
    }

    private async mockSuggestClauses(type: string): Promise<ClauseSuggestion[]> {
        await this.simulateDelay(500);
        return [
            {
                title: `Standard ${type} Clause`,
                content: `[Standard content for ${type} clause placeholder]`,
                category: type,
                confidence: 0.9,
            }
        ];
    }

    private async mockImproveClause(clause: string): Promise<{ original: string; improved: string; changes: string[] }> {
        await this.simulateDelay(500);
        return {
            original: clause,
            improved: clause + ' (Improved)',
            changes: ['Added clarity (Mock)'],
        };
    }

    private simulateDelay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
