/**
 * Oracle Router Service
 * 
 * Tier 1: Pattern-based routing - NO AI COST
 * Handles common queries without calling AI
 */

import { Injectable, Logger } from '@nestjs/common';
import { ContractStatus } from '@prisma/client';

export interface RouteResult {
    matched: boolean;
    tier: 1 | 2 | 3;
    intent?: string;
    params?: any;
}

interface PatternMatcher {
    pattern: RegExp;
    intent: string;
    extract?: (match: RegExpMatchArray) => any;
}

@Injectable()
export class OracleRouterService {
    private readonly logger = new Logger(OracleRouterService.name);

    private readonly patterns: PatternMatcher[] = [
        // Count queries
        {
            pattern: /how many.*contracts?.*today/i,
            intent: 'COUNT_TODAY'
        },
        {
            pattern: /how many.*contracts?/i,
            intent: 'COUNT_ALL'
        },
        {
            pattern: /count.*contracts?/i,
            intent: 'COUNT_ALL'
        },

        // Approval-related queries
        {
            pattern: /(?:show|list|get|find).*(?:pending|awaiting).*legal|legal.*(?:pending|awaiting)|(?:sent|submitted).*legal/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.SENT_TO_LEGAL] })
        },
        {
            pattern: /(?:show|list|get|find).*(?:pending|awaiting).*finance|finance.*(?:pending|awaiting)|(?:sent|submitted).*finance/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.SENT_TO_FINANCE] })
        },
        {
            pattern: /(?:show|list|get|find).*(?:legal|legally).*approved|approved.*(?:by )?legal/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: ['LEGAL_APPROVED' as ContractStatus] })  // Cast to standard
        },
        {
            pattern: /(?:show|list|get|find).*finance.*approved|approved.*(?:by )?finance/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: ['FINANCE_APPROVED' as ContractStatus] })  // Cast to standard
        },
        {
            pattern: /(?:show|list|get|find).*(?:fully )?approved/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.APPROVED] })
        },
        {
            pattern: /(?:show|list|get|find).*(?:pending|awaiting).*approval/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.SENT_TO_LEGAL, ContractStatus.SENT_TO_FINANCE] })
        },
        // Rejected Status
        {
            pattern: /(?:show|list|get|find).*rejected.*contracts?|contracts?.*rejected/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.REJECTED] })
        },
        // Terminated Status
        {
            pattern: /(?:show|list|get|find).*terminated.*contracts?|contracts?.*terminated/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.TERMINATED] })
        },

        // Status-based queries
        {
            pattern: /(?:show|list|get|find).*draft.*contracts?|contracts?.*draft/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.DRAFT] })
        },
        {
            pattern: /(?:show|list|get|find).*active.*contracts?|contracts?.*active/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.ACTIVE] })
        },
        {
            pattern: /(?:show|list|get|find).*(?:signed|executed).*contracts?|contracts?.*(?:signed|executed)/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.EXECUTED] })  // EXECUTED is the actual status
        },
        {
            pattern: /(?:show|list|get|find).*sent.*contracts?|contracts?.*sent|sent.*counterparty/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: ['SENT_TO_COUNTERPARTY'] })  // Using string
        },
        {
            pattern: /(?:show|list|get|find).*cancelled.*contracts?|contracts?.*cancelled/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.CANCELLED] })
        },
        {
            pattern: /(?:show|list|get|find).*expired.*contracts?|contracts?.*expired/i,
            intent: 'LIST_BY_STATUS',
            extract: () => ({ status: [ContractStatus.EXPIRED] })
        },

        // Expiring contracts
        {
            pattern: /contracts?.*expiring|expiring.*contracts?/i,
            intent: 'LIST_EXPIRING',
            extract: (match) => {
                // Try to extract days: "expiring in 30 days"
                const daysMatch = match[0].match(/(\d+)\s*days?/);
                return { expiringDays: daysMatch ? parseInt(daysMatch[1]) : 30 };
            }
        },

        // Time-based queries
        {
            pattern: /(?:show|list|get).*(?:created|made|added).*today|today.*contracts?/i,
            intent: 'COUNT_TODAY'
        },
        {
            pattern: /(?:show|list|get).*(?:this|current).*week/i,
            intent: 'LIST_BY_DATE',
            extract: () => ({ days: 7 })
        },
        {
            pattern: /(?:show|list|get).*(?:this|current).*month/i,
            intent: 'LIST_BY_DATE',
            extract: () => ({ days: 30 })
        },
        {
            pattern: /(?:show|list|get).*last.*(\d+).*days?/i,
            intent: 'LIST_BY_DATE',
            extract: (match) => ({ days: parseInt(match[1]) })
        },

        // Amount-based queries
        {
            pattern: /contracts?.*(?:above|over|greater than|more than)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|lac|L|cr|crore|C)?/i,
            intent: 'LIST_BY_AMOUNT',
            extract: (match) => {
                let amount = parseFloat(match[1].replace(/,/g, ''));
                const unit = match[0].toLowerCase();
                if (unit.includes('lakh') || unit.includes('lac') || unit.includes('l')) amount *= 100000;
                if (unit.includes('crore') || unit.includes('cr') || unit.includes('c')) amount *= 10000000;
                return { minAmount: amount };
            }
        },
        {
            pattern: /contracts?.*(?:below|under|less than)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|lac|L|cr|crore|C)?/i,
            intent: 'LIST_BY_AMOUNT',
            extract: (match) => {
                let amount = parseFloat(match[1].replace(/,/g, ''));
                const unit = match[0].toLowerCase();
                if (unit.includes('lakh') || unit.includes('lac') || unit.includes('l')) amount *= 100000;
                if (unit.includes('crore') || unit.includes('cr') || unit.includes('c')) amount *= 10000000;
                return { maxAmount: amount };
            }
        },
        {
            pattern: /high.*value|large.*contracts?|biggest|highest/i,
            intent: 'LIST_BY_AMOUNT',
            extract: () => ({ minAmount: 1000000, sort: 'amount_desc' })  // ₹10L+
        },

        // Counterparty-based
        {
            pattern: /contracts?.*(?:with|from)\s+([A-Z][a-zA-Z\s]+(?:Ltd|Limited|Inc|Corp|Pvt)?\.?)/i,
            intent: 'LIST_BY_COUNTERPARTY',
            extract: (match) => ({ counterparty: match[1].trim() })
        },

        // Template-based
        {
            pattern: /(?:show|list|get).*nda|non-disclosure/i,
            intent: 'LIST_BY_TEMPLATE',
            extract: () => ({ templateType: 'NDA' })
        },
        {
            pattern: /(?:show|list|get).*msa|master.*service/i,
            intent: 'LIST_BY_TEMPLATE',
            extract: () => ({ templateType: 'MSA' })
        },
        {
            pattern: /(?:show|list|get).*employment|offer.*letter/i,
            intent: 'LIST_BY_TEMPLATE',
            extract: () => ({ templateType: 'EMPLOYMENT' })
        },
        {
            pattern: /(?:show|list|get).*vendor|purchase/i,
            intent: 'LIST_BY_TEMPLATE',
            extract: () => ({ templateType: 'VENDOR' })
        },
        {
            pattern: /(?:show|list|get).*service.*agreement/i,
            intent: 'LIST_BY_TEMPLATE',
            extract: () => ({ templateType: 'SERVICE' })
        },

        // My contracts (user-specific)
        {
            pattern: /(?:show|list|get).*(?:my|mine).*contracts?|contracts?.*(?:i created|i made)/i,
            intent: 'LIST_MY_CONTRACTS'
        },

        // User/Team queries
        {
            pattern: /how many.*legal.*(?:users?|team|people|members?)/i,
            intent: 'COUNT_USERS_BY_ROLE',
            extract: () => ({ role: 'LEGAL' })
        },
        {
            pattern: /how many.*finance.*(?:users?|team|people|members?)/i,
            intent: 'COUNT_USERS_BY_ROLE',
            extract: () => ({ role: 'FINANCE' })
        },
        {
            pattern: /how many.*(?:active )?(?:users?|team members?|people)/i,
            intent: 'COUNT_USERS'
        },
        {
            pattern: /(?:show|list|get).*legal.*(?:team|users?|members?)/i,
            intent: 'LIST_USERS_BY_ROLE',
            extract: () => ({ role: 'LEGAL' })
        },
        {
            pattern: /(?:show|list|get).*finance.*(?:team|users?|members?)/i,
            intent: 'LIST_USERS_BY_ROLE',
            extract: () => ({ role: 'FINANCE' })
        },
        {
            pattern: /(?:show|list|get).*(?:all )?(?:users?|team|members?)/i,
            intent: 'LIST_USERS'
        },
        {
            pattern: /who.*(?:approve|can approve)/i,
            intent: 'LIST_USERS_BY_PERMISSION',
            extract: () => ({ permission: 'APPROVE_CONTRACTS' })
        },

        // Global version queries (New - Instant)
        {
            pattern: /(?:show|list|get).*(?:recent|latest).*versions?/i,
            intent: 'LIST_GLOBAL_VERSIONS'
        },

        // Contract version queries
        {
            pattern: /(?:how many|count).*versions?.*(?:of|for)?\s*(?:contract\s*)?([A-Z]{3}-\d{4}-\d{3,})/i,
            intent: 'COUNT_VERSIONS',
            extract: (match) => ({ reference: match[1] })
        },
        {
            pattern: /(?:show|list|get).*version.*(?:history|list).*(?:of|for)?\s*(?:contract\s*)?([A-Z]{3}-\d{4}-\d{3,})/i,
            intent: 'LIST_VERSIONS',
            extract: (match) => ({ reference: match[1] })
        },
        {
            pattern: /(?:what|show).*changed.*(?:in\s*)?version\s*(\d+)/i,
            intent: 'GET_VERSION_CHANGES',
            extract: (match) => ({ versionNumber: parseInt(match[1]) })
        },
        {
            pattern: /latest.*version.*(?:of|for)?\s*(?:contract\s*)?([A-Z]{3}-\d{4}-\d{3,})/i,
            intent: 'GET_LATEST_VERSION',
            extract: (match) => ({ reference: match[1] })
        },

        // Specific contract by reference (Strict View Only)
        // Explicitly requires "show/view/get/open" to avoid capturing "summarize"
        {
            pattern: /(?:show|view|get|open|detail).*(?:contract)?\s*#?\s*([A-Z]{3}-\d{4}-\d{3,})/i,
            intent: 'GET_BY_REFERENCE',
            extract: (match) => ({ reference: match[1] })
        },

        // Explicit AI tasks (Force Tier 2)
        // Routes summarize/analyze/explain queries directly to AI
        {
            pattern: /(?:summarize|analyze|explain|rewrite|review).*/i,
            intent: 'EXPLICIT_AI' // Will be handled by routing logic to return matched=false (Tier 2) or custom Tier 2 return
        },

        // Recent contracts
        {
            pattern: /(?:show|list|get).*(?:recent|latest|new).*contracts?/i,
            intent: 'LIST_RECENT'
        }
    ];

    /**
     * Route query to appropriate tier and extract intent
     */
    route(query: string): RouteResult {
        const normalized = query.trim();

        // Try pattern matching (Tier 1)
        for (const matcher of this.patterns) {
            const match = normalized.match(matcher.pattern);
            if (match) {
                // If explicit AI intent, bypass Tier 1 and force Tier 2
                if (matcher.intent === 'EXPLICIT_AI') {
                    this.logger.log(`Explicit AI match: ${normalized}`);
                    return { matched: false, tier: 2 };
                }

                this.logger.log(`Tier 1 match: ${matcher.intent}`);

                return {
                    matched: true,
                    tier: 1,
                    intent: matcher.intent,
                    params: matcher.extract ? matcher.extract(match) : {}
                };
            }
        }

        // Check if it's a simple conversational query - route to Tier 3
        const conversationalPatterns = [
            /what (?:is|are|should)/i,
            /how (?:do|can|should)/i,
            /why (?:is|are|should)/i,
            /explain|describe|tell me about/i,
            /help me/i
        ];

        for (const pattern of conversationalPatterns) {
            if (pattern.test(normalized)) {
                this.logger.log('Routing to Tier 3 (conversational)');
                return {
                    matched: true,
                    tier: 3,
                    intent: 'CONVERSATIONAL'
                };
            }
        }

        // Default: Complex query - route to Tier 2 (AI function calling)
        this.logger.log('Routing to Tier 2 (function calling)');
        return {
            matched: false,
            tier: 2
        };
    }

    /**
     * Sanitize query to prevent prompt injection
     */
    sanitizeQuery(query: string): string {
        return query
            // Remove potential injection attempts
            .replace(/ignore\s+(previous|above|all)\s+instructions?/gi, '')
            .replace(/system\s+prompt/gi, '')
            .replace(/pretend\s+you\s+are/gi, '')
            .replace(/act\s+as/gi, '')
            // Limit length
            .substring(0, 500)
            .trim();
    }
}
