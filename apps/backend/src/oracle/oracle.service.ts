/**
 * Oracle Service - Main Orchestrator
 * 
 * 3-Tier AI Chat System with RBAC and Cost Optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { OracleSecurityService } from './services/oracle-security.service';
import { OracleRouterService } from './services/oracle-router.service';
import { OracleRateLimiterService } from './services/oracle-rate-limiter.service';
import { OracleExecutorService } from './services/oracle-executor.service';
import { OracleChatRequestDto } from './dto/oracle-chat.dto';
import { ORACLE_FUNCTIONS } from './oracle-functions';
import { ORACLE_SYSTEM_PROMPT } from './oracle.constants';

export interface OracleResponse {
    type: 'chat' | 'list' | 'count' | 'detail' | 'error';
    content: string;
    data?: {
        contracts?: any[];
        count?: number;
        contract?: any;
        users?: any[];      // For user queries
        role?: string;       // For role-specific queries
        versions?: any[];    // For version list queries
        changelog?: any;     // For version changelog queries
    };
    meta?: {
        tier: number;
        scope?: string;
        cached?: boolean;
        executionTime?: number;
        tokensUsed?: number;      // Added for AI cost tracking
        functionCalled?: string;  // Added for debugging
        sources?: any[];          // Added for RAG citations
    };
}

@Injectable()
export class OracleService {
    private readonly logger = new Logger(OracleService.name);

    constructor(
        private prisma: PrismaService,
        private aiService: AiService,
        private auditService: AuditService,
        private securityService: OracleSecurityService,
        private routerService: OracleRouterService,
        private rateLimiter: OracleRateLimiterService,
        private executor: OracleExecutorService
    ) { }

    async handleChat(
        userId: string,
        orgId: string,
        permissions: string[],
        dto: OracleChatRequestDto
    ): Promise<OracleResponse> {
        this.logger.log(`Oracle request from user ${userId}: "${dto.query}"`);

        // Sanitize query
        const sanitizedQuery = this.routerService.sanitizeQuery(dto.query);

        try {
            // TIER 1: Pattern Matching (No AI)
            const route = this.routerService.route(sanitizedQuery);

            if (route.tier === 1 && route.intent) {
                await this.rateLimiter.enforceLimit(userId, 1);
                const result = await this.handleTier1(userId, orgId, permissions, route.intent, route.params);

                // Save to conversation history
                await this.saveConversation(userId, orgId, dto.query, result.content, 1, null);

                return result;
            }

            // TIER 2: AI Function Calling (gpt-3.5-turbo)
            if (route.tier === 2) {
                await this.rateLimiter.enforceLimit(userId, 2);
                const result = await this.handleTier2(userId, orgId, permissions, sanitizedQuery, dto.contextContent);

                await this.saveConversation(
                    userId,
                    orgId,
                    dto.query,
                    result.content,
                    2,
                    result.meta?.functionCalled
                );

                return result;
            }

            // TIER 3: Conversational AI (gpt-4-turbo)
            await this.rateLimiter.enforceLimit(userId, 3);
            const result = await this.handleTier3(userId, orgId, permissions, sanitizedQuery, dto.contextContent);

            await this.saveConversation(userId, orgId, dto.query, result.content, 3, null);

            return result;

        } catch (error: any) {
            this.logger.error(`Oracle error for user ${userId}:`, {
                message: error.message,
                stack: error.stack,
                query: sanitizedQuery,
                tier: error.tier || 'unknown'
            });

            // Log error to audit
            try {
                await this.auditService.log({
                    userId,
                    organizationId: orgId,
                    action: AuditService.Actions.AI_CHAT_MESSAGE,
                    module: AuditService.Modules.AI,
                    metadata: {
                        query: sanitizedQuery,
                        error: error.message
                    }
                });
            } catch (auditError) {
                this.logger.error('Failed to log to audit:', auditError);
            }

            throw error;
        }
    }

    /**
     * TIER 1: Direct pattern matching - instant response
     */
    private async handleTier1(
        userId: string,
        orgId: string,
        permissions: string[],
        intent: string,
        params: any
    ): Promise<OracleResponse> {
        this.logger.log(`Tier 1 handling: ${intent}`);

        switch (intent) {
            case 'COUNT_TODAY': {
                const result = await this.executor.execute(
                    'get_contracts_created_today',
                    {},
                    userId,
                    orgId,
                    permissions
                );
                return {
                    type: 'count',
                    content: `You have ${result.count} contract(s) created today.`,
                    data: { count: result.count, contracts: result.contracts },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'COUNT_ALL': {
                const result = await this.executor.execute(
                    'count_contracts',
                    {},
                    userId,
                    orgId,
                    permissions
                );
                return {
                    type: 'count',
                    content: `You have access to ${result.count} contract(s).`,
                    data: { count: result.count },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'COUNT_USERS': {
                const result = await this.executor.execute(
                    'count_users',
                    params,
                    userId,
                    orgId,
                    permissions
                );

                if (result.error) {
                    return {
                        type: 'chat',
                        content: `❌ ${result.error}`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }

                return {
                    type: 'count',
                    content: `Your organization has ${result.count} active user(s).`,
                    data: { count: result.count },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'COUNT_USERS_BY_ROLE': {
                const result = await this.executor.execute(
                    'count_users',
                    params,
                    userId,
                    orgId,
                    permissions
                );

                if (result.error) {
                    return {
                        type: 'chat',
                        content: `❌ ${result.error}`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }

                const roleLabel = params.role ? `${params.role.toLowerCase()} ` : '';
                return {
                    type: 'count',
                    content: `Your organization has ${result.count} ${roleLabel}user(s).`,
                    data: { count: result.count, role: params.role },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'LIST_USERS': {
                const result = await this.executor.execute(
                    'list_users',
                    params,
                    userId,
                    orgId,
                    permissions
                );

                if (result.error) {
                    return {
                        type: 'chat',
                        content: `❌ ${result.error}`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }

                return {
                    type: 'list',
                    content: `Found ${result.users.length} user(s) in your organization:`,
                    data: { users: result.users },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'LIST_USERS_BY_ROLE': {
                const result = await this.executor.execute(
                    'list_users',
                    params,
                    userId,
                    orgId,
                    permissions
                );

                if (result.error) {
                    return {
                        type: 'chat',
                        content: `❌ ${result.error}`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }

                const roleLabel = params.role ? `${params.role.toLowerCase()} ` : '';
                return {
                    type: 'list',
                    content: `Found ${result.users.length} ${roleLabel}user(s):`,
                    data: { users: result.users },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'LIST_USERS_BY_PERMISSION': {
                const result = await this.executor.execute(
                    'list_users',
                    params,
                    userId,
                    orgId,
                    permissions
                );

                if (result.error) {
                    return {
                        type: 'chat',
                        content: `❌ ${result.error}`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }

                return {
                    type: 'list',
                    content: `Users with permission to ${params.permission}:`,
                    data: { users: result.users },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'COUNT_VERSIONS': {
                const result = await this.executor.execute(
                    'count_contract_versions',
                    params,
                    userId,
                    orgId,
                    permissions
                );

                if (result.error) {
                    return {
                        type: 'chat',
                        content: `❌ ${result.error}`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }

                return {
                    type: 'count',
                    content: `Contract ${params.reference} has ${result.count} version(s).`,
                    data: { count: result.count },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'LIST_VERSIONS': {
                const result = await this.executor.execute(
                    'list_contract_versions',
                    params,
                    userId,
                    orgId,
                    permissions
                );

                if (result.error) {
                    return {
                        type: 'chat',
                        content: `❌ ${result.error}`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }

                return {
                    type: 'list',
                    content: `Version history for contract ${params.reference}:`,
                    data: { versions: result.versions },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'LIST_GLOBAL_VERSIONS': {
                const result = await this.executor.listGlobalRecentVersions(
                    userId,
                    orgId,
                    permissions,
                    10 // default limit
                );

                return {
                    type: 'list',
                    content: `Here are the latest contract versions across your organization:`,
                    data: { versions: result.versions },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'GET_VERSION_CHANGES':
            case 'GET_LATEST_VERSION': {
                const result = await this.executor.execute(
                    'get_version_changelog',
                    params,
                    userId,
                    orgId,
                    permissions
                );

                if (result.error) {
                    return {
                        type: 'chat',
                        content: `❌ ${result.error}`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }

                return {
                    type: 'detail',
                    content: `Changes in version ${result.changelog.version}:`,
                    data: { changelog: result.changelog },
                    meta: { tier: 1, scope: result.scope }
                };
            }

            case 'LIST_RECENT': {
                const scope = this.securityService.determineScope(permissions);
                const contracts = await this.securityService.fetchAllowedContracts(
                    userId,
                    orgId,
                    scope,
                    { limit: 10 }
                );

                return {
                    type: 'list',
                    content: `Your most recent contracts:`,
                    data: { contracts: this.securityService.sanitizeForAI(contracts) },
                    meta: { tier: 1, scope }
                };
            }

            case 'LIST_BY_STATUS': {
                const scope = this.securityService.determineScope(permissions);
                const contracts = await this.securityService.fetchAllowedContracts(
                    userId,
                    orgId,
                    scope,
                    params
                );

                return {
                    type: 'list',
                    content: `I found ${contracts.length} contract(s) matching your criteria:`,
                    data: { contracts: this.securityService.sanitizeForAI(contracts) },
                    meta: {
                        tier: 1,
                        scope
                    }
                };
            }

            case 'LIST_MY_CONTRACTS': {
                // Force USER_ONLY scope for "my contracts" queries
                const contracts = await this.securityService.fetchAllowedContracts(
                    userId,
                    orgId,
                    'USER_ONLY',
                    { limit: 20 }
                );

                return {
                    type: 'list',
                    content: `You have ${contracts.length} contract(s):`,
                    data: { contracts: this.securityService.sanitizeForAI(contracts) },
                    meta: {
                        tier: 1,
                        scope: 'USER_ONLY'
                    }
                };
            }

            case 'LIST_EXPIRING': {
                const scope = this.securityService.determineScope(permissions);
                const contracts = await this.securityService.fetchAllowedContracts(
                    userId,
                    orgId,
                    scope,
                    params
                );

                const days = params.expiringDays || 30;
                return {
                    type: 'list',
                    content: `Found ${contracts.length} contract(s) expiring in the next ${days} days:`,
                    data: { contracts: this.securityService.sanitizeForAI(contracts) },
                    meta: {
                        tier: 1,
                        scope
                    }
                };
            }

            case 'GET_BY_REFERENCE': {
                const result = await this.executor.execute(
                    'get_contract_details',
                    params,
                    userId,
                    orgId,
                    permissions
                );
                if (result.contract) {
                    return {
                        type: 'detail',
                        content: `Contract ${result.contract.reference}: ${result.contract.title}`,
                        data: { contract: result.contract },
                        meta: { tier: 1, scope: result.scope }
                    };
                } else {
                    return {
                        type: 'detail',
                        content: `Contract not found or you don't have access to it.`,
                        meta: { tier: 1, scope: result.scope }
                    };
                }
            }


            default:
                throw new Error(`Unknown Tier 1 intent: ${intent}`);
        }
    }

    /**
     * TIER 2: AI with function calling
     */
    private async handleTier2(
        userId: string,
        orgId: string,
        permissions: string[],
        query: string,
        contextContent?: string
    ): Promise<OracleResponse> {
        this.logger.log(`Tier 2 handling with AI function calling`);

        const systemPrompt = contextContent
            ? `${ORACLE_SYSTEM_PROMPT}\n\nACTIVE DOCUMENT CONTEXT:\n${contextContent}`
            : ORACLE_SYSTEM_PROMPT;

        const aiResponse = await this.aiService.chatWithFunctions(
            systemPrompt,
            query,
            ORACLE_FUNCTIONS,
            { provider: 'openai', model: 'gpt-3.5-turbo' }
        );

        if (aiResponse.type === 'function_call' && aiResponse.functionCall) {
            const { name, arguments: args } = aiResponse.functionCall;

            this.logger.log(`AI requested function: ${name}`);
            const result = await this.executor.execute(name, args, userId, orgId, permissions);

            // Generate natural language response
            let content = '';
            if (name === 'count_contracts') {
                content = `There are ${result.count} contracts matching your criteria.`;
            } else if (name === 'list_contracts') {
                content = `I found ${result.contracts.length} contracts matching your request.`;
            } else if (name === 'get_contract_details') {
                content = result.contract
                    ? `Here are the details for contract ${result.contract.reference}.`
                    : `Contract not found or access denied.`;
            } else {
                content = `Found ${result.contracts?.length || result.count || 0} result(s).`;
            }

            // [RAG] Attach sources for semantic search results
            let sources = undefined;
            if (name === 'search_contracts' && result.results) {
                content = `Here are the relevant contract excerpts I found matching "${args.query}".`;
                sources = result.results;
            }

            return {
                type: name.includes('count') ? 'count' : name.includes('list') ? 'list' : 'detail',
                content,
                data: result,
                meta: {
                    tier: 2,
                    functionCalled: name,
                    scope: result.scope,
                    tokensUsed: 500, // Estimate for gpt-3.5
                    sources: sources
                }
            };
        }

        // Fallback if AI didn't call function
        return {
            type: 'chat',
            content: aiResponse.content,
            meta: { tier: 2, tokensUsed: 300 }
        };
    }

    /**
     * TIER 3: Full conversational AI
     */
    private async handleTier3(
        userId: string,
        orgId: string,
        permissions: string[],
        query: string,
        contextContent?: string
    ): Promise<OracleResponse> {
        this.logger.log(`Tier 3 handling with conversational AI`);

        // Get user's allowed data for context
        const context = await this.securityService.buildSecureContext(
            userId,
            orgId,
            permissions,
            { limit: 20 }
        );

        let contextPrompt = `${ORACLE_SYSTEM_PROMPT}\n\nUSER CONTEXT:\n${JSON.stringify(context, null, 2)}`;

        if (contextContent) {
            contextPrompt += `\n\nACTIVE DOCUMENT (Priority Context):\n${contextContent}`;
        }

        contextPrompt += `
- Role: ${context.scope === 'ORG_WIDE' ? 'Organization-wide access' : 'Own contracts only'}
- Available contracts: ${context.count}

RECENT CONTRACTS (for reference):
${JSON.stringify(context.metadata.slice(0, 5), null, 2)}

Answer the user's question based on this context.`;

        const response = await this.aiService.chat(
            contextPrompt,
            query,
            { provider: 'openai', model: 'gpt-4-turbo' }
        );

        return {
            type: 'chat',
            content: response,
            meta: {
                tier: 3,
                scope: context.scope,
                tokensUsed: 1500 // Estimate for gpt-4
            }
        };
    }

    /**
     * Save conversation to database
     */
    private async saveConversation(
        userId: string,
        orgId: string,
        userQuery: string,
        assistantResponse: string,
        tier: number,
        functionCalled?: string | null
    ): Promise<void> {
        try {
            // Find or create active conversation
            let conversation = await this.prisma.oracleConversation.findFirst({
                where: {
                    userId,
                    organizationId: orgId,
                    isActive: true
                },
                orderBy: { createdAt: 'desc' }
            });

            if (!conversation) {
                conversation = await this.prisma.oracleConversation.create({
                    data: {
                        userId,
                        organizationId: orgId,
                        title: userQuery.substring(0, 100),
                        isActive: true
                    }
                });
            }

            // Save user message
            await this.prisma.oracleMessage.create({
                data: {
                    conversationId: conversation.id,
                    role: 'user',
                    content: userQuery
                }
            });

            // Save assistant message
            await this.prisma.oracleMessage.create({
                data: {
                    conversationId: conversation.id,
                    role: 'assistant',
                    content: assistantResponse,
                    tier,
                    functionCalled: functionCalled || undefined
                }
            });

            this.logger.log(`Saved conversation to DB: ${conversation.id}`);
        } catch (error) {
            this.logger.error(`Failed to save conversation: ${error}`);
            // Don't throw - conversation saving is not critical
        }
    }
}
