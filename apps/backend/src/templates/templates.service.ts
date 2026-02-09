/**
 * Templates Service
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Template, TemplateCategory, Prisma } from '@prisma/client';

@Injectable()
export class TemplatesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get templates available for an organization
     */
    /**
     * Get templates available for an organization (Paginated)
     */
    async findForOrganization(
        organizationId: string,
        params?: {
            page?: number;
            limit?: number;
            search?: string;
            category?: string;
        },
    ) {
        const page = Number(params?.page) || 1;
        const limit = Number(params?.limit) || 12; // Grid view usually benefits from larger default pages or multiple of 2/3/4
        const skip = (page - 1) * limit;

        const where: Prisma.TemplateWhereInput = {
            isActive: true,
            ...(params?.category && params.category !== 'ALL' ? { category: params.category as any } : {}),
            OR: [
                { isGlobal: true },
                {
                    organizationAccess: {
                        some: {
                            organizationId,
                            isEnabled: true,
                        },
                    },
                },
            ],
            ...(params?.search && {
                AND: {
                    OR: [
                        { name: { contains: params.search, mode: 'insensitive' } },
                        { code: { contains: params.search, mode: 'insensitive' } },
                    ],
                },
            }),
        };

        const [data, total] = await Promise.all([
            this.prisma.template.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    code: true,
                    category: true,
                    description: true,
                    baseContent: false, // Explicitly false if using omit, but with select we just omit it
                    isGlobal: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    annexures: {
                        select: {
                            id: true,
                            name: true,
                            order: true
                        },
                        orderBy: { order: 'asc' }
                    }
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.template.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                lastPage: Math.ceil(total / limit),
                currentPage: page,
                perPage: limit,
                prev: page > 1 ? page - 1 : null,
                next: page < Math.ceil(total / limit) ? page + 1 : null,
            },
        };
    }

    /**
     * Get template by ID
     */
    async findById(id: string) {
        const template = await this.prisma.template.findUnique({
            where: { id },
            include: {
                annexures: {
                    orderBy: { order: 'asc' },
                },
                organizationAccess: true, // [New] Include org access for edit mode
            },
        });

        if (!template) {
            throw new NotFoundException('Template not found');
        }

        return template;
    }

    /**
     * Create a new template with annexures (admin only)
     */
    /**
     * Create a new template with annexures (admin only)
     */
    async create(
        userId: string,
        organizationId: string,
        data: {
            name: string;
            code: string;
            category: TemplateCategory;
            description?: string;
            baseContent: string;
            isGlobal?: boolean;
            targetOrgIds?: string[]; // [New] Specific Org Assignment
            annexures?: {
                name: string;
                title: string;
                content: string;
                fieldsConfig?: any[];
            }[];
        },
    ): Promise<Template> {
        return this.prisma.$transaction(async (tx) => {
            // 1. Create the Template
            const template = await tx.template.create({
                data: {
                    name: data.name,
                    code: data.code.toUpperCase(),
                    category: data.category,
                    description: data.description,
                    baseContent: data.baseContent,
                    isGlobal: data.isGlobal ?? false,
                    createdByUserId: userId,
                },
            });

            // 2. Create Annexures if any
            if (data.annexures && data.annexures.length > 0) {
                await tx.annexure.createMany({
                    data: data.annexures.map((annexure, index) => ({
                        templateId: template.id,
                        name: annexure.name,
                        title: annexure.title,
                        content: annexure.content,
                        fieldsConfig: annexure.fieldsConfig || [],
                        order: index + 1, // Auto-increment order
                    })),
                });
            }

            // 3. Organization Linking Logic
            // If Global: No specific org links needed (accessible by all)
            // If Not Global: Link to specific orgs OR default to creator's org
            if (!data.isGlobal) {
                const orgsToLink = (data.targetOrgIds && data.targetOrgIds.length > 0)
                    ? data.targetOrgIds
                    : [organizationId]; // Default to creator's org

                // Deduplicate just in case
                const uniqueOrgs = [...new Set(orgsToLink)];

                await tx.templateOrganization.createMany({
                    data: uniqueOrgs.map(orgId => ({
                        templateId: template.id,
                        organizationId: orgId,
                        isEnabled: true,
                    }))
                });
            }

            return template;
        });
    }

    /**
     * Update template
     */
    async update(
        id: string,
        data: Prisma.TemplateUpdateInput & {
            targetOrgIds?: string[]; // [New] Update assignments
            annexures?: {
                name: string;
                title: string;
                content: string;
                fieldsConfig?: any[];
            }[];
        },
    ): Promise<Template> {
        return this.prisma.$transaction(async (tx) => {
            // 1. Update Template Fields
            // Extract custom fields to avoid Prisma errors
            const { annexures, targetOrgIds, ...templateData } = data;

            const template = await tx.template.update({
                where: { id },
                data: templateData,
            });

            // 2. Update Annexures (Full Replacement Strategy)
            if (annexures) {
                // Delete existing
                await tx.annexure.deleteMany({
                    where: { templateId: id },
                });

                // Create new
                if (annexures.length > 0) {
                    await tx.annexure.createMany({
                        data: annexures.map((annexure, index) => ({
                            templateId: id,
                            name: annexure.name,
                            title: annexure.title,
                            content: annexure.content,
                            fieldsConfig: annexure.fieldsConfig || [],
                            order: index + 1,
                        })),
                    });
                }
            }

            // 3. Update Organization Assignments if provided
            if (targetOrgIds !== undefined) {
                // Always clear existing links first (clean slate)
                await tx.templateOrganization.deleteMany({
                    where: { templateId: id }
                });

                // If NOT global and targets provided, re-link
                // (If global, we leave links empty as it's accessible to all)
                if (template.isGlobal === false && targetOrgIds.length > 0) {
                    await tx.templateOrganization.createMany({
                        data: targetOrgIds.map(orgId => ({
                            templateId: id,
                            organizationId: orgId,
                            isEnabled: true,
                        }))
                    });
                }
            }

            return template;
        });
    }

    /**
     * Enable template for organization
     */
    async enableForOrganization(templateId: string, organizationId: string) {
        return this.prisma.templateOrganization.upsert({
            where: {
                templateId_organizationId: { templateId, organizationId },
            },
            update: { isEnabled: true },
            create: { templateId, organizationId, isEnabled: true },
        });
    }

    /**
     * Disable template for organization
     */
    async disableForOrganization(templateId: string, organizationId: string) {
        return this.prisma.templateOrganization.update({
            where: {
                templateId_organizationId: { templateId, organizationId },
            },
            data: { isEnabled: false },
        });
    }
}
