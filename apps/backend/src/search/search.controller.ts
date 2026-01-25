/**
 * Search Controller
 * 
 * Advanced search with filters and saved queries.
 */

import { Controller, Get, Post, Delete, Query, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface SearchFilters {
    status?: string[];
    dateFrom?: string;
    dateTo?: string;
    counterparty?: string;
    templateId?: string;
}

@Controller('search')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class SearchController {
    constructor(private prisma: PrismaService) { }

    /**
     * Search contracts with full-text and filters
     */
    @Get('contracts')
    @Permissions('contract:view')
    async searchContracts(
        @CurrentUser() user: AuthenticatedUser,
        @Query('q') query?: string,
        @Query('status') status?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('counterparty') counterparty?: string,
        @Query('templateId') templateId?: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        const orgId = user.orgId;
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: Record<string, unknown> = {
            organizationId: orgId,
        };

        // Full-text search on title and reference
        if (query && query.trim()) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { reference: { contains: query, mode: 'insensitive' } },
                { counterpartyName: { contains: query, mode: 'insensitive' } },
            ];
        }

        // Status filter
        if (status) {
            const statuses = status.split(',').map(s => s.trim().toUpperCase());
            where.status = { in: statuses };
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
            }
            if (dateTo) {
                (where.createdAt as Record<string, Date>).lte = new Date(dateTo);
            }
        }

        // Counterparty filter
        if (counterparty) {
            where.counterpartyName = { contains: counterparty, mode: 'insensitive' };
        }

        // Template filter
        if (templateId) {
            where.templateId = templateId;
        }

        // Execute search
        const [contracts, total] = await Promise.all([
            this.prisma.contract.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    reference: true,
                    status: true,
                    counterpartyName: true,
                    createdAt: true,
                    updatedAt: true,
                    template: {
                        select: { name: true, category: true },
                    },
                },
            }),
            this.prisma.contract.count({ where }),
        ]);

        return {
            data: contracts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    /**
     * Get saved searches for current user
     */
    @Get('saved')
    @Permissions('contract:view')
    async getSavedSearches(@CurrentUser() user: AuthenticatedUser) {
        return this.prisma.savedSearch.findMany({
            where: { userId: user.id },
            orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        });
    }

    /**
     * Save a search query
     */
    @Post('saved')
    @Permissions('contract:view')
    async saveSearch(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { name: string; query: string; filters: SearchFilters; isDefault?: boolean },
    ) {
        // If setting as default, unset any existing default
        if (body.isDefault) {
            await this.prisma.savedSearch.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false },
            });
        }

        return this.prisma.savedSearch.create({
            data: {
                userId: user.id,
                name: body.name,
                query: { searchText: body.query } as Prisma.InputJsonValue,
                filters: (body.filters || {}) as Prisma.InputJsonValue,
                isDefault: body.isDefault || false,
            },
        });
    }

    /**
     * Delete a saved search
     */
    @Delete('saved/:id')
    @Permissions('contract:view')
    async deleteSavedSearch(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ) {
        const savedSearch = await this.prisma.savedSearch.findFirst({
            where: { id, userId: user.id },
        });

        if (!savedSearch) {
            return { success: false, message: 'Saved search not found' };
        }

        await this.prisma.savedSearch.delete({ where: { id } });
        return { success: true };
    }

    /**
     * Get available filter options
     */
    @Get('filters')
    @Permissions('contract:view')
    async getFilterOptions(@CurrentUser() user: AuthenticatedUser) {
        const [templates, statuses] = await Promise.all([
            this.prisma.template.findMany({
                where: {
                    OR: [
                        { isGlobal: true },
                        { organizationAccess: { some: { organizationId: user.orgId, isEnabled: true } } },
                    ],
                },
                select: { id: true, name: true, category: true },
            }),
            this.prisma.contract.groupBy({
                by: ['status'],
                where: { organizationId: user.orgId },
                _count: true,
            }),
        ]);

        return {
            templates,
            statuses: statuses.map(s => ({
                value: s.status,
                label: s.status.replace(/_/g, ' '),
                count: s._count,
            })),
        };
    }
}
