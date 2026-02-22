/**
 * Templates Service
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Template, TemplateCategory, Prisma } from '@prisma/client';

// Helper: extract all {{VARIABLE_NAME}} from HTML content
function extractVarKeys(html: string): string[] {
    const regex = /\{\{([A-Z0-9_]+)\}\}/g;
    const keys: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
        if (!keys.includes(match[1])) {
            keys.push(match[1]);
        }
    }
    return keys;
}

// Helper: convert SNAKE_CASE key to human-readable label
function keyToLabel(key: string): string {
    return key
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

@Injectable()
export class TemplatesService {
    constructor(private prisma: PrismaService) { }

    /**
     * Extract all {{VARIABLE_NAME}} placeholders from a template's content.
     * Returns a unified, deduplicated variable schema with metadata.
     */
    async extractVariables(templateId: string) {
        const template = await this.prisma.template.findUnique({
            where: { id: templateId },
            include: {
                annexures: { orderBy: { order: 'asc' } },
            },
        });

        if (!template) throw new NotFoundException('Template not found');

        const storedMainMeta: any[] = Array.isArray(template.variablesConfig) ? template.variablesConfig as any[] : [];
        const seen = new Set<string>();
        const variables: any[] = [];

        // 1. Scan main contract
        const mainKeys = extractVarKeys(template.baseContent);
        for (const key of mainKeys) {
            if (seen.has(key)) continue;
            seen.add(key);
            const meta = storedMainMeta.find((m: any) => m.key === key) || {};
            variables.push({
                key,
                label: meta.label || keyToLabel(key),
                type: meta.type || 'text',
                required: meta.required ?? true,
                placeholder: meta.placeholder || '',
                source: 'main',
                sourceLabel: 'Main Agreement',
            });
        }

        // 2. Scan each annexure
        for (const annexure of template.annexures) {
            const annexKeys = extractVarKeys(annexure.content);
            const storedAnnexMeta: any[] = Array.isArray(annexure.fieldsConfig) ? annexure.fieldsConfig as any[] : [];
            for (const key of annexKeys) {
                if (seen.has(key)) continue;
                seen.add(key);
                const meta = storedAnnexMeta.find((m: any) => m.key === key) || {};
                variables.push({
                    key,
                    label: meta.label || keyToLabel(key),
                    type: meta.type || 'text',
                    required: meta.required ?? true,
                    placeholder: meta.placeholder || '',
                    source: 'annexure',
                    sourceLabel: annexure.title || annexure.name,
                });
            }
        }

        return { variables, total: variables.length };
    }

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
        const limit = Number(params?.limit) || 12;
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
                organizationAccess: true,
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
    async create(
        userId: string,
        organizationId: string,
        data: {
            name: string;
            code: string;
            category: TemplateCategory;
            description?: string;
            baseContent: string;
            variablesConfig?: any[];
            isGlobal?: boolean;
            targetOrgIds?: string[];
            annexures?: {
                name: string;
                title: string;
                content: string;
                fieldsConfig?: any[];
            }[];
        },
    ): Promise<Template> {
        return this.prisma.$transaction(async (tx) => {
            const template = await tx.template.create({
                data: {
                    name: data.name,
                    code: data.code.toUpperCase(),
                    category: data.category,
                    description: data.description,
                    baseContent: data.baseContent,
                    variablesConfig: data.variablesConfig || [],
                    isGlobal: data.isGlobal ?? false,
                    createdByUserId: userId,
                },
            });

            if (data.annexures && data.annexures.length > 0) {
                await tx.annexure.createMany({
                    data: data.annexures.map((annexure, index) => ({
                        templateId: template.id,
                        name: annexure.name,
                        title: annexure.title,
                        content: annexure.content,
                        fieldsConfig: annexure.fieldsConfig || [],
                        order: index + 1,
                    })),
                });
            }

            if (!data.isGlobal) {
                const orgsToLink = (data.targetOrgIds && data.targetOrgIds.length > 0)
                    ? data.targetOrgIds
                    : [organizationId];

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
            targetOrgIds?: string[];
            annexures?: {
                name: string;
                title: string;
                content: string;
                fieldsConfig?: any[];
            }[];
        },
    ): Promise<Template> {
        return this.prisma.$transaction(async (tx) => {
            const { annexures, targetOrgIds, ...templateData } = data;

            const template = await tx.template.update({
                where: { id },
                data: templateData,
            });

            if (annexures) {
                await tx.annexure.deleteMany({
                    where: { templateId: id },
                });

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

            if (targetOrgIds !== undefined) {
                await tx.templateOrganization.deleteMany({
                    where: { templateId: id }
                });

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
