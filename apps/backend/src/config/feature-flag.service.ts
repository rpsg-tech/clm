import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const SYSTEM_FEATURES = [
    { code: 'AI_CONTRACT_REVIEW', name: 'AI Contract Review', description: 'Enable AI-powered contract analysis and suggestions' },
    { code: 'AI_CLAUSE_GENERATION', name: 'AI Clause Generation', description: 'Generate contract clauses using AI' },
    { code: 'ADVANCED_ANALYTICS', name: 'Advanced Analytics', description: 'Enable advanced reporting and analytics dashboard' },
    { code: 'E_SIGNATURE', name: 'E-Signature Integration', description: 'Enable electronic signature workflows' },
    { code: 'MULTI_CURRENCY', name: 'Multi-Currency Support', description: 'Support multiple currencies in contracts' },
    { code: 'CUSTOM_WORKFLOWS', name: 'Custom Workflows', description: 'Enable custom approval workflow builder' },
    { code: 'OCR', name: 'OCR Processing', description: 'Enable OCR for uploaded documents' },
    { code: 'FINANCE_WORKFLOW', name: 'Finance Review Workflow', description: 'Enable specific finance review workflow steps' },
];

@Injectable()
export class FeatureFlagService {
    constructor(private prisma: PrismaService) { }

    /**
     * Check if a specific feature is enabled for an organization
     * (Internal use for Guards/Services)
     */
    async isEnabled(featureCode: string, organizationId: string): Promise<boolean> {
        if (!organizationId) return false;

        const flag = await this.prisma.featureFlag.findUnique({
            where: {
                organizationId_featureCode: {
                    organizationId,
                    featureCode,
                },
            },
        });

        return flag?.isEnabled ?? false;
    }

    /**
     * Get validated config for a feature
     */
    async getConfig(featureCode: string, organizationId: string): Promise<any> {
        const flag = await this.prisma.featureFlag.findUnique({
            where: {
                organizationId_featureCode: {
                    organizationId,
                    featureCode,
                },
            },
        });
        return flag?.config || {};
    }

    /**
     * Get all flags with their status for an org
     */
    async getAllFlags(organizationId: string) {
        // Get DB state
        const storedFlags = await this.prisma.featureFlag.findMany({
            where: { organizationId },
        });
        const flagMap = new Map(storedFlags.map(f => [f.featureCode, f]));

        // Merge with System Definitions
        return SYSTEM_FEATURES.map(feat => ({
            code: feat.code,
            name: feat.name,
            description: feat.description,
            isEnabled: flagMap.get(feat.code)?.isEnabled ?? false,
            config: flagMap.get(feat.code)?.config ?? null,
        }));
    }

    /**
     * Update or Create a flag setting
     */
    async updateFlag(organizationId: string, featureCode: string, isEnabled: boolean, config?: any) {
        // Validate code
        if (!SYSTEM_FEATURES.some(f => f.code === featureCode)) {
            throw new Error(`Invalid feature code: ${featureCode}`);
        }

        return this.prisma.featureFlag.upsert({
            where: {
                organizationId_featureCode: { organizationId, featureCode }
            },
            create: { organizationId, featureCode, isEnabled, config },
            update: { isEnabled, config }
        });
    }

    getAvailableFeatures() {
        return SYSTEM_FEATURES;
    }
}
