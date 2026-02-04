import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import OpenAI from 'openai';

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

export interface AiConfig {
    provider: 'google' | 'openai';
    model: string;
}

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI | null = null;
    private openai: OpenAI | null = null;

    constructor(private configService: ConfigService) {
        // Initialize Gemini
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (geminiKey) {
            this.genAI = new GoogleGenerativeAI(geminiKey);
            this.logger.log('✅ Gemini Client initialized');
        } else {
            this.logger.warn('⚠️ GEMINI_API_KEY missing - Gemini provider unavailable');
        }

        // Initialize OpenAI
        const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (openaiKey) {
            this.openai = new OpenAI({ apiKey: openaiKey });
            this.logger.log('✅ OpenAI Client initialized');
        } else {
            this.logger.warn('⚠️ OPENAI_API_KEY missing - OpenAI provider unavailable');
        }
    }

    /**
     * Analyze a contract
     */
    async analyzeContract(content: string, title?: string, config?: AiConfig): Promise<ContractAnalysis> {
        this.logger.log(`Analyzing contract: ${title || 'Untitled'} using ${config?.provider || 'default (mock)'}`);

        const provider = config?.provider || 'mock';
        const modelName = config?.model;

        if (provider === 'google' && this.genAI) {
            return this.analyzeWithGemini(content, modelName || 'gemini-1.5-flash');
        } else if (provider === 'openai' && this.openai) {
            return this.analyzeWithOpenAI(content, modelName || 'gpt-4-turbo');
        }

        return this.mockAnalyze(content);
    }

    /**
     * Suggest clauses based on context
     */
    async suggestClauses(context: string, clauseType: string, config?: AiConfig): Promise<ClauseSuggestion[]> {
        const provider = config?.provider || 'mock';
        const modelName = config?.model;

        if (provider === 'google' && this.genAI) {
            return this.suggestWithGemini(context, clauseType, modelName || 'gemini-1.5-flash');
        } else if (provider === 'openai' && this.openai) {
            return this.suggestWithOpenAI(context, clauseType, modelName || 'gpt-4-turbo');
        }

        return this.mockSuggestClauses(clauseType);
    }

    /**
     * Improve an existing clause
     */
    async improveClause(clause: string, config?: AiConfig): Promise<{ original: string; improved: string; changes: string[] }> {
        const provider = config?.provider || 'mock';
        const modelName = config?.model;

        if (provider === 'google' && this.genAI) {
            return this.improveWithGemini(clause, modelName || 'gemini-1.5-flash');
        } else if (provider === 'openai' && this.openai) {
            return this.improveWithOpenAI(clause, modelName || 'gpt-4-turbo');
        }

        return this.mockImproveClause(clause);
    }

    /**
     * Extract expiry date from contract text
     */
    async extractExpiryDate(content: string, config?: AiConfig): Promise<{ expiryDate: Date | null; confidence: number; explanation: string }> {
        const provider = config?.provider || 'mock';
        const modelName = config?.model;

        if (provider === 'google' && this.genAI) {
            return this.extractDateWithGemini(content, modelName || 'gemini-1.5-flash');
        } else if (provider === 'openai' && this.openai) {
            return this.extractDateWithOpenAI(content, modelName || 'gpt-4-turbo');
        }

        return this.mockExtractExpiryDate(content);
    }

    /**
     * General Chat / RAG
     */
    async chat(systemPrompt: string, userQuery: string, config?: AiConfig): Promise<string> {
        this.logger.log(`Chat request: ${userQuery.substring(0, 30)}...`);
        const provider = config?.provider || 'mock';
        const modelName = config?.model;

        if (provider === 'google' && this.genAI) {
            return this.chatWithGemini(systemPrompt, userQuery, modelName || 'gemini-1.5-flash');
        } else if (provider === 'openai' && this.openai) {
            return this.chatWithOpenAI(systemPrompt, userQuery, modelName || 'gpt-4-turbo');
        }

        return "I am running in MOCK mode. Please configure a valid AI provider to chat.";
    }

    // ============ GEMINI IMPLEMENTATION ============

    private async chatWithGemini(systemPrompt: string, userQuery: string, modelName: string): Promise<string> {
        try {
            const model = this.genAI!.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(`${systemPrompt}\n\nUser Query: ${userQuery}`);
            return result.response.text();
        } catch (error) {
            this.logger.error(`Gemini Chat failed: ${error}`);
            throw error;
        }
    }

    // ============ OPENAI IMPLEMENTATION ============

    private async chatWithOpenAI(systemPrompt: string, userQuery: string, modelName: string): Promise<string> {
        try {
            const completion = await this.openai!.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userQuery }
                ]
            });
            return completion.choices[0].message.content || "";
        } catch (error) {
            this.logger.error(`OpenAI Chat failed: ${error}`);
            throw error;
        }
    }

    private async analyzeWithGemini(content: string, modelName: string): Promise<ContractAnalysis> {
        try {
            const model = this.genAI!.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
                You are an Expert Legal AI. Analyze the following contract and return a strict JSON object.
                Do not include markdown formatting.
                Schema:
                {
                    "riskScore": number (1-10),
                    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
                    "keyTerms": [{"term": string, "value": string, "category": string, "importance": "HIGH"|"MEDIUM"|"LOW"}],
                    "issues": [{"severity": "CRITICAL"|"WARNING"|"INFO", "title": string, "description": string, "recommendation": string}],
                    "suggestions": [string],
                    "summary": string
                }

                Contract Content:
                "${content.substring(0, 30000)}"
            `;

            const result = await model.generateContent(prompt);
            return JSON.parse(result.response.text()) as ContractAnalysis;
        } catch (error) {
            this.logger.error(`Gemini Analysis failed: ${error}`);
            throw error;
        }
    }

    private async suggestWithGemini(context: string, clauseType: string, modelName: string): Promise<ClauseSuggestion[]> {
        try {
            const model = this.genAI!.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
                Generate 3 standard legal clauses for type "${clauseType}".
                Context: "${context}"
                Return JSON Array: [{"title": string, "content": string, "category": string, "confidence": number}]
            `;

            const result = await model.generateContent(prompt);
            return JSON.parse(result.response.text()) as ClauseSuggestion[];
        } catch (error) {
            this.logger.error(`Gemini Suggestion failed: ${error}`);
            throw error;
        }
    }

    private async improveWithGemini(clause: string, modelName: string): Promise<any> {
        try {
            const model = this.genAI!.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
                Improve this clause for clarity and risk mitigation.
                Clause: "${clause}"
                Return JSON: {"original": string, "improved": string, "changes": [string]}
            `;

            const result = await model.generateContent(prompt);
            return JSON.parse(result.response.text());
        } catch (error) {
            this.logger.error(`Gemini Improvement failed: ${error}`);
            throw error;
        }
    }

    // ============ OPENAI IMPLEMENTATION ============

    private async analyzeWithOpenAI(content: string, modelName: string): Promise<ContractAnalysis> {
        try {
            const completion = await this.openai!.chat.completions.create({
                model: modelName,
                messages: [
                    {
                        role: "system",
                        content: "You are an Expert Legal AI. Analyze the contract and return valid JSON."
                    },
                    {
                        role: "user",
                        content: `Analyze this contract:\n\n${content.substring(0, 30000)}\n\nReturn JSON with schema: riskScore, riskLevel, keyTerms, issues, suggestions, summary.`
                    }
                ],
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content!) as ContractAnalysis;
        } catch (error) {
            this.logger.error(`OpenAI Analysis failed: ${error}`);
            throw error;
        }
    }

    private async suggestWithOpenAI(context: string, clauseType: string, modelName: string): Promise<ClauseSuggestion[]> {
        try {
            const completion = await this.openai!.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: "Generate legal clauses in JSON array format." },
                    { role: "user", content: `Generate 3 clauses for type "${clauseType}". Context: ${context}` }
                ],
                response_format: { type: "json_object" }
            });

            // OpenAI json_object requires a root object, so we expect { "clauses": [...] } or standard parsing
            const parsed = JSON.parse(completion.choices[0].message.content!);
            return Array.isArray(parsed) ? parsed : (parsed.clauses || []);
        } catch (error) {
            this.logger.error(`OpenAI Suggestion failed: ${error}`);
            throw error;
        }
    }

    private async improveWithOpenAI(clause: string, modelName: string): Promise<any> {
        try {
            const completion = await this.openai!.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: "Improve legal clauses. Return JSON." },
                    { role: "user", content: `Improve this clause: "${clause}"` }
                ],
                response_format: { type: "json_object" }
            });
            return JSON.parse(completion.choices[0].message.content!);
        } catch (error) {
            this.logger.error(`OpenAI Improvement failed: ${error}`);
            throw error;
        }
    }

    // ============ DATE EXTRACTION IMPLEMENTATION ============

    private async extractDateWithGemini(content: string, modelName: string): Promise<{ expiryDate: Date | null; confidence: number; explanation: string }> {
        try {
            const model = this.genAI!.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
                Analyze the contract text and identify the Expiry Date or Termination Date.
                Return JSON: {"expiryDate": "YYYY-MM-DD" | null, "confidence": number (0-1), "explanation": string}
                Context: "${content.substring(0, 15000)}"
            `;

            const result = await model.generateContent(prompt);
            const parsed = JSON.parse(result.response.text());

            return {
                expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
                confidence: parsed.confidence,
                explanation: parsed.explanation
            };
        } catch (error) {
            this.logger.error(`Gemini Date Extraction failed: ${error}`);
            throw error;
        }
    }

    private async extractDateWithOpenAI(content: string, modelName: string): Promise<{ expiryDate: Date | null; confidence: number; explanation: string }> {
        try {
            const completion = await this.openai!.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: "Extract contract expiry date. Return JSON." },
                    { role: "user", content: `Identify expiry date in this text: "${content.substring(0, 15000)}"` }
                ],
                response_format: { type: "json_object" }
            });

            const parsed = JSON.parse(completion.choices[0].message.content!);
            return {
                expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
                confidence: parsed.confidence,
                explanation: parsed.explanation
            };
        } catch (error) {
            this.logger.error(`OpenAI Date Extraction failed: ${error}`);
            throw error;
        }
    }

    // ============ MOCK METHODS ============

    private async mockExtractExpiryDate(content: string): Promise<{ expiryDate: Date | null; confidence: number; explanation: string }> {
        await this.simulateDelay(500);

        // Simple heuristic for mock
        const mockDate = new Date();
        mockDate.setFullYear(mockDate.getFullYear() + 1);

        return {
            expiryDate: mockDate,
            confidence: 0.85,
            explanation: "Detected standard 1-year term (Mock)",
        };
    }

    private async mockAnalyze(content: string): Promise<ContractAnalysis> {
        await this.simulateDelay(1000);
        this.logger.warn('Returning MOCK analysis result');

        const contentLower = content.toLowerCase();
        const issues: Issue[] = [];
        const keyTerms: KeyTerm[] = [];

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
            summary: 'Mock analysis completed. Configure Gemini or OpenAI API key for live results.',
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
