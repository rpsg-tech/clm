/**
 * Admin Templates Controller
 * 
 * Full CRUD for template governance by admins.
 */

import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards, Query, ForbiddenException, ParseEnumPipe } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateCategory } from '@prisma/client';

@Controller('admin/templates')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class AdminTemplatesController {
    constructor(
        private readonly templatesService: TemplatesService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * List all templates (admin view - shows all, not just org-enabled)
     */
    @Get()
    @Permissions('template:view')
    async findAll(
        @Query('category', new ParseEnumPipe(TemplateCategory, { optional: true }))
        category?: TemplateCategory
    ) {
        return this.prisma.template.findMany({
            where: {
                ...(category && { category }),
            },
            include: {
                organizationAccess: {
                    include: { organization: true }
                }
            },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Get single template with full details
     */
    @Get(':id')
    @Permissions('template:view')
    async findOne(@Param('id') id: string) {
        return this.prisma.template.findUnique({
            where: { id },
            include: {
                annexures: { orderBy: { order: 'asc' } },
                organizationAccess: {
                    include: { organization: true }
                }
            }
        });
    }

    /**
     * Create a new template
     */
    @Post()
    @Permissions('template:create')
    async create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: {
            name: string;
            code: string;
            category: TemplateCategory;
            description?: string;
            baseContent: string;
            isGlobal?: boolean;
        }
    ) {
        // Enforce Global Permission
        if (body.isGlobal && !user.permissions.includes('template:global')) {
            throw new ForbiddenException('You do not have permission to create Global templates.');
        }

        return this.templatesService.create(user.id, user.orgId!, body);
    }

    /**
     * Update template
     */
    @Put(':id')
    @Permissions('template:edit')
    async update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() body: {
            name?: string;
            description?: string;
            baseContent?: string;
            isGlobal?: boolean;
            isActive?: boolean;
            annexures?: {
                name: string;
                title: string;
                content: string;
                fieldsConfig?: any[];
            }[];
        }
    ) {
        // Enforce Global Permission checks
        if (body.isGlobal !== undefined) {
            if (body.isGlobal && !user.permissions.includes('template:global')) {
                throw new ForbiddenException('You do not have permission to manage Global templates.');
            }

            // Also preventing UN-setting global if they don't have permission? 
            // Logic: If they can't manage global, they shouldn't change status at all.
            // But usually it's about CREATING global.
            // Let's stick to strict check: if touching isGlobal, need permission.
            if (!user.permissions.includes('template:global')) {
                // Check if existing is Global?
                const existing = await this.prisma.template.findUnique({ where: { id } });
                if (existing?.isGlobal) {
                    throw new ForbiddenException('You cannot edit Global templates.');
                }
            }
        } else {
            // Even if not changing isGlobal, if the template IS global, need permission?
            // Yes, typically Org Admins shouldn't edit Global templates.
            const existing = await this.prisma.template.findUnique({ where: { id } });
            if (existing?.isGlobal && !user.permissions.includes('template:global')) {
                throw new ForbiddenException('You cannot edit Global templates.');
            }
        }

        return this.templatesService.update(id, body);
    }

    /**
     * Enable template for an organization
     */
    @Patch(':id/enable/:orgId')
    @Permissions('template:edit')
    async enableForOrg(
        @Param('id') templateId: string,
        @Param('orgId') organizationId: string
    ) {
        return this.templatesService.enableForOrganization(templateId, organizationId);
    }

    /**
     * Disable template for an organization
     */
    @Patch(':id/disable/:orgId')
    @Permissions('template:edit')
    async disableForOrg(
        @Param('id') templateId: string,
        @Param('orgId') organizationId: string
    ) {
        return this.templatesService.disableForOrganization(templateId, organizationId);
    }
}
