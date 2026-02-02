import { Injectable, Logger } from '@nestjs/common';
import { OracleChatRequestDto, OracleContext } from './dto/oracle-chat.dto';
import { ContractsService } from '../contracts/contracts.service';
import { ORACLE_SYSTEM_PROMPT } from './oracle.constants';

@Injectable()
export class OracleService {
    private readonly logger = new Logger(OracleService.name);

    constructor(private readonly contractsService: ContractsService) { }

    async handleChat(userId: string, orgId: string, role: string, dto: OracleChatRequestDto) {
        this.logger.log(`Processing Oracle request for user ${userId} (${role})`);

        // 1. Build Secure Context (The "Fence")
        const context = await this.buildContext(userId, orgId, role, dto.query);

        // 2. Construct Safe Payload (The "Guardrails")
        const llmPayload = {
            system: ORACLE_SYSTEM_PROMPT,
            user_context: {
                user_id: userId, // ID is safe for internal logging, AI might use it for "Hello <User>"
                role: role,
                organization_id: orgId
            },
            data_context: {
                allowed_contracts: context.retrievedMetadata,
                // In a real RAG, this would include vector search results (clauses, snippets)
                retrieved_documents: []
            },
            user_query: dto.query
        };

        // 3. Execute LLM Call (Mocked for Demo, but strict structure)
        // In production: const aiResponse = await this.llmService.generate(llmPayload);

        let mockResponse = "Based on the available information, I don't have enough authorized data to answer that request.";

        if (context.allowedContractIds.length > 0) {
            // Simulating a compliant AI response
            const contractsList = context.retrievedMetadata.map(c => `- [${c.title}](/dashboard/contracts/${c.id}) (${c.status})`).join('\n');
            mockResponse = `I found the following contracts within your authorized scope:\n\n${contractsList}\n\nHow would you like me to assist with these?`;
        } else {
            // Diagnostic Response
            const criteria = context.searchCriteria;
            this.logger.log(`Oracle Diagnostics: Org=${orgId}, Status=${criteria}, Results=0`);
            mockResponse = `I searched for **${criteria}** contracts in Organization \`${orgId}\` but found 0 matches accessible to your **${role}** role.\n\n(Debug: Status='${criteria}')\n\nHowever, you can [create a new contract](/dashboard/contracts/new) if you have permissions.`;
        }

        return {
            response: mockResponse,
            // debug_payload: llmPayload, // internal debug only, remove in prod
            meta: {
                contracts_found: context.allowedContractIds.length,
                execution_mode: "STRICT_CONTEXT_FENCE",
                scope_org: orgId
            }
        };
    }

    /**
     * THE FENCE: Strictly filters data access before AI touch.
     * Only fetches data that corresponds to the User's Role and Organization.
     */
    private async buildContext(userId: string, orgId: string, role: string, query: string): Promise<OracleContext & { retrievedMetadata: any[], searchCriteria: string }> {
        // Determine search params based on query (Intent Extraction)
        const searchParams: any = { limit: 5 }; // Default to recent 5
        const lowerQuery = query.toLowerCase();

        // Refined Intent Logic: Intent Classification
        // FORCE_REBUILD_TRIGGER: 2026-01-30T18:30:00
        this.logger.debug(`Oracle Intent Analysis - Query: "${lowerQuery}"`);

        if (lowerQuery.includes('expiring') || lowerQuery.includes('renew')) {
            searchParams.expiringDays = 30; // Look ahead 30 days
        }

        if (lowerQuery.includes('active')) {
            searchParams.status = 'ACTIVE';
        } else if (lowerQuery.includes('draft')) {
            searchParams.status = 'DRAFT';
        } else if (lowerQuery.includes('pending') || lowerQuery.includes('approval')) {
            // "Pending drafts" usually means pending approval, unless 'draft' is explicit
            searchParams.status = 'PENDING_LEGAL';
        }

        if (lowerQuery.includes('search') || lowerQuery.includes('find')) {
            // Extract basic search term (very naive)
            const parts = lowerQuery.split(' ');
            const searchIdx = parts.findIndex(p => p === 'search' || p === 'find');
            if (searchIdx !== -1 && parts[searchIdx + 1]) {
                searchParams.search = parts[searchIdx + 1];
            }
        }

        // STRICT: Always pass organizationId
        // If user is basic user, we might want to filter by createdByUserId?
        // For now, adhering to Org-level access as defined in ContractsService.
        // If ContractsService had a method "findAllForUser", we'd use that. 
        // findByOrganization filters by Org, which is the baseline.

        // In a real scenario, we'd further check if user has specific permissions, 
        // but findByOrganization retrieves what is visible to the Org members usually.
        // Use `createdByUserId` if role is restricted? 
        // Let's assume 'business' role sees only their own?
        if (role === 'business' || role === 'sales') {
            searchParams.createdByUserId = userId;
        }

        // Fetch permitted data
        const result = await this.contractsService.findByOrganization(orgId, searchParams);

        const criteriaDesc = searchParams.status || (searchParams.expiringDays ? 'expiring' : 'recent');

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
            searchCriteria: criteriaDesc
        };
    }
}
