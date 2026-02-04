import { Injectable, Logger } from '@nestjs/common';
import { OracleChatRequestDto, OracleContext } from './dto/oracle-chat.dto';
import { ContractsService } from '../contracts/contracts.service';
import { AiService } from '../ai/ai.service';
import { ORACLE_SYSTEM_PROMPT } from './oracle.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OracleService {
    private readonly logger = new Logger(OracleService.name);

    constructor(
        private readonly contractsService: ContractsService,
        private readonly aiService: AiService,
        private readonly prisma: PrismaService
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

    async handleChat(userId: string, orgId: string, role: string, dto: OracleChatRequestDto) {
        this.logger.log(`Processing Oracle request for user ${userId} (${role})`);

        // 1. Identify Context (Is user looking at a specific contract?)
        let activeContractContext = "";
        const contractIdMatch = dto.contextUrl?.match(/\/contracts\/([a-zA-Z0-9-]+)/);

        if (contractIdMatch && contractIdMatch[1]) {
            try {
                const contractId = contractIdMatch[1];
                // Verify access via service (it throws if not found/allowed)
                const contract = await this.contractsService.findById(contractId, orgId);

                if (contract) {
                    activeContractContext = `
                    ACTIVE DOCUMENT CONTEXT:
                    Title: ${contract.title}
                    Status: ${contract.status}
                    Content: """${(contract as any).content}"""
                    `;
                    this.logger.log(`Oracle: Injected context for contract ${contractId}`);
                }
            } catch (e) {
                this.logger.warn(`Oracle: Could not fetch context contract`, e);
            }
        }

        // 2. Build Safety System Prompt
        const aiConfig = await this.getAiConfig(orgId);
        const provider = aiConfig.provider || 'mock';
        const model = aiConfig.model || 'gemini-1.5-flash';

        // 3. Construct LLM Prompt
        // If provider is mock, we return the mock response directly from AiService (simulated)
        // But AiService 'analyze' is structured JSON. We need a 'chat' method in AiService or use analyze with a custom prompt?
        // Let's use the 'suggestClauses' primitive or add a generic 'chat' primitive to AiService.
        // For now, I'll use a direct call pattern similar to how AiService works, but I need to expose a generic 'chat' or 'generateText' method in AiService.
        // Wait, AiService only has specific methods. I should add a generic query method to AiService to support this.

        // REFACTOR PLAN: Add `chat(systemPrompt, userQuery, config)` to AiService.
        // For now, let's strictly use the existing service. 
        // Actually, I can't easily add a method without editing AiService again. 
        // I will edit AiService to add `chat()` method first.

        return {
            response: "I'm updating my brain to support open-ended chat contracts. Please refresh in a moment.",
            meta: { mode: "maintenance" }
        };
    }

    /**
     * THE FENCE: Strictly filters data access before AI touch.
     * Only fetches data that corresponds to the User's Role and Organization.
     */
    private async buildContext(userId: string, orgId: string, role: string, query: string): Promise<OracleContext & { retrievedMetadata: any[], searchCriteria: string }> {
        // ... existing logic ...
        // (Keeping existing buildContext logic for search intent if needed later)
        const searchParams: any = { limit: 5 };
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('expiring') || lowerQuery.includes('renew')) {
            searchParams.expiringDays = 30;
        }

        if (lowerQuery.includes('active')) {
            searchParams.status = 'ACTIVE';
        } else if (lowerQuery.includes('draft')) {
            searchParams.status = 'DRAFT';
        } else if (lowerQuery.includes('pending')) {
            searchParams.status = 'SENT_TO_LEGAL';
        }

        if (role === 'business' || role === 'sales') {
            searchParams.createdByUserId = userId;
        }

        const result = await this.contractsService.findByOrganization(orgId, searchParams);

        return {
            userId,
            organizationId: orgId,
            userRole: role,
            allowedContractIds: result.data.map(c => c.id),
            retrievedMetadata: result.data.map(c => ({
                id: c.id,
                title: c.title,
                status: c.status,
                amount: c.amount
            })),
            searchCriteria: searchParams.status || 'recent'
        };
    }
}
