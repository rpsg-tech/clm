/**
 * Oracle Function Definitions
 * 
 * These are OpenAI function schemas that define what the AI can request.
 * The AI NEVER executes these - it only suggests which function to call with what parameters.
 */

import { ContractStatus } from '@prisma/client';

export const ORACLE_FUNCTIONS = [
    {
        type: "function" as const,
        function: {
            name: "count_contracts",
            description: "Count contracts matching specific criteria. Use for questions like 'how many contracts...?'",
            parameters: {
                type: "object",
                properties: {
                    status: {
                        type: "string",
                        enum: Object.values(ContractStatus),
                        description: "Filter by contract status"
                    },
                    createdToday: {
                        type: "boolean",
                        description: "Only count contracts created today"
                    },
                    expiringDays: {
                        type: "number",
                        description: "Count contracts expiring within N days"
                    },
                    minAmount: {
                        type: "number",
                        description: "Minimum contract amount"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "list_contracts",
            description: "List contracts with filtering and sorting. Use for 'show me...', 'list...', 'find...' queries",
            parameters: {
                type: "object",
                properties: {
                    status: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: Object.values(ContractStatus)
                        },
                        description: "Filter by one or more statuses"
                    },
                    expiringDays: {
                        type: "number",
                        description: "Show contracts expiring within N days"
                    },
                    minAmount: {
                        type: "number",
                        description: "Minimum contract value"
                    },
                    maxAmount: {
                        type: "number",
                        description: "Maximum contract value"
                    },
                    searchTerm: {
                        type: "string",
                        description: "Search in title, reference, or counterparty name"
                    },
                    limit: {
                        type: "number",
                        description: "Maximum number of results (default: 10, max: 50)"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_contract_details",
            description: "Get detailed information about a specific contract by ID or reference number",
            parameters: {
                type: "object",
                properties: {
                    contractId: {
                        type: "string",
                        description: "UUID of the contract"
                    },
                    reference: {
                        type: "string",
                        description: "Contract reference number (e.g., REF-2024-001)"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_contracts_created_today",
            description: "Get all contracts created today",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_expiring_contracts",
            description: "Get contracts expiring soon (default: 30 days)",
            parameters: {
                type: "object",
                properties: {
                    days: {
                        type: "number",
                        description: "Number of days to look ahead (default: 30)"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "count_users",
            description: "Count users in the organization, optionally filtered by role. Requires VIEW_USERS permission.",
            parameters: {
                type: "object",
                properties: {
                    role: {
                        type: "string",
                        description: "Filter by role code (LEGAL, FINANCE, etc.)"
                    },
                    activeOnly: {
                        type: "boolean",
                        description: "Only count active users (default: true)"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "list_users",
            description: "List users in the organization with sanitized data. Admins see full details, regular users see limited info. Requires VIEW_USERS permission.",
            parameters: {
                type: "object",
                properties: {
                    role: {
                        type: "string",
                        description: "Filter by role code (LEGAL, FINANCE, etc.)"
                    },
                    permission: {
                        type: "string",
                        description: "Filter by specific permission (e.g., APPROVE_CONTRACTS)"
                    },
                    activeOnly: {
                        type: "boolean",
                        description: "Only show active users (default: true)"
                    },
                    limit: {
                        type: "number",
                        description: "Maximum number of results (default: 20, max: 50)"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "count_contract_versions",
            description: "Count the number of versions for a specific contract. Requires access to the contract.",
            parameters: {
                type: "object",
                properties: {
                    reference: {
                        type: "string",
                        description: "Contract reference number (e.g., ABC-2024-001)"
                    }
                },
                required: ["reference"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "list_contract_versions",
            description: "List all versions of a contract with changelog summaries. Requires access to the contract.",
            parameters: {
                type: "object",
                properties: {
                    reference: {
                        type: "string",
                        description: "Contract reference number (e.g., ABC-2024-001)"
                    },
                    limit: {
                        type: "number",
                        description: "Maximum number of versions to return (default: 20)"
                    }
                },
                required: ["reference"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_version_changelog",
            description: "Get detailed changelog for a specific contract version showing what changed.",
            parameters: {
                type: "object",
                properties: {
                    reference: {
                        type: "string",
                        description: "Contract reference number"
                    },
                    versionNumber: {
                        type: "number",
                        description: "Version number to get changelog for"
                    }
                },
                required: ["reference", "versionNumber"]
            }
        }
    }
];

/**
 * Mapping of function names to executor methods
 */
export type OracleFunctionName =
    | 'count_contracts'
    | 'list_contracts'
    | 'get_contract_details'
    | 'get_contracts_created_today'
    | 'get_expiring_contracts'
    | 'count_users'
    | 'list_users'
    | 'count_contract_versions'
    | 'list_contract_versions'
    | 'get_version_changelog';
