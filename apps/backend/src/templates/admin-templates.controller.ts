/**
 * Admin Templates Controller
 * 
 * Full CRUD for template governance by admins.
 */

import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
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
    @Permissions('admin:template:govern')
    async findAll(@Query('category') category?: TemplateCategory) {
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
    @Permissions('admin:template:govern')
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
    @Permissions('admin:template:govern')
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
        return this.templatesService.create(user.id, body);
    }

    /**
     * Update template
     */
    @Put(':id')
    @Permissions('admin:template:govern')
    async update(
        @Param('id') id: string,
        @Body() body: {
            name?: string;
            description?: string;
            baseContent?: string;
            isGlobal?: boolean;
            isActive?: boolean;
        }
    ) {
        return this.templatesService.update(id, body);
    }

    /**
     * Enable template for an organization
     */
    @Patch(':id/enable/:orgId')
    @Permissions('admin:template:govern')
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
    @Permissions('admin:template:govern')
    async disableForOrg(
        @Param('id') templateId: string,
        @Param('orgId') organizationId: string
    ) {
        return this.templatesService.disableForOrganization(templateId, organizationId);
    }
}
