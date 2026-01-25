/**
 * Feature Flags Controller
 * 
 * Manage feature flags per organization.
 */

import { Controller, Get, Put, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

// System-defined feature flags
const SYSTEM_FEATURES = [
    { code: 'AI_CONTRACT_REVIEW', name: 'AI Contract Review', description: 'Enable AI-powered contract analysis and suggestions' },
    { code: 'AI_CLAUSE_GENERATION', name: 'AI Clause Generation', description: 'Generate contract clauses using AI' },
    { code: 'ADVANCED_ANALYTICS', name: 'Advanced Analytics', description: 'Enable advanced reporting and analytics dashboard' },
    { code: 'E_SIGNATURE', name: 'E-Signature Integration', description: 'Enable electronic signature workflows' },
    { code: 'MULTI_CURRENCY', name: 'Multi-Currency Support', description: 'Support multiple currencies in contracts' },
    { code: 'CUSTOM_WORKFLOWS', name: 'Custom Workflows', description: 'Enable custom approval workflow builder' },
];

@Controller('feature-flags')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class FeatureFlagsController {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all feature flags for current organization
     */
    @Get()
    @Permissions('admin:org:manage')
    async getFlags(@CurrentUser() user: AuthenticatedUser) {
        if (!user.orgId) {
            throw new ForbiddenException('Organization context required');
        }

        // Get existing flags for this org
        const existingFlags = await this.prisma.featureFlag.findMany({
            where: { organizationId: user.orgId }
        });

        // Map existing flags by code
        const flagMap = new Map(existingFlags.map(f => [f.featureCode, f]));

        // Return all system features with current status
        return SYSTEM_FEATURES.map(feature => ({
            code: feature.code,
            name: feature.name,
            description: feature.description,
            isEnabled: flagMap.get(feature.code)?.isEnabled ?? false,
            config: flagMap.get(feature.code)?.config ?? null,
        }));
    }

    /**
     * Toggle a feature flag for current organization
     */
    @Put(':code')
    @Permissions('admin:org:manage')
    async toggleFlag(
        @CurrentUser() user: AuthenticatedUser,
        @Param('code') featureCode: string,
        @Body() body: { isEnabled: boolean; config?: any }
    ) {
        if (!user.orgId) {
            throw new ForbiddenException('Organization context required');
        }

        // Validate feature code
        if (!SYSTEM_FEATURES.some(f => f.code === featureCode)) {
            throw new ForbiddenException('Invalid feature code');
        }

        return this.prisma.featureFlag.upsert({
            where: {
                organizationId_featureCode: {
                    organizationId: user.orgId,
                    featureCode,
                }
            },
            update: {
                isEnabled: body.isEnabled,
                config: body.config ?? undefined,
            },
            create: {
                organizationId: user.orgId,
                featureCode,
                isEnabled: body.isEnabled,
                config: body.config ?? undefined,
            }
        });
    }

    /**
     * Get available features (for UI dropdown/listing)
     */
    @Get('available')
    @Permissions('admin:org:manage')
    async getAvailableFeatures() {
        return SYSTEM_FEATURES;
    }
}
