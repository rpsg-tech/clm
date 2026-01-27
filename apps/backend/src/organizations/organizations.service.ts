/**
 * Organizations Service
 * 
 * Handles organization management including hierarchy.
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Organization, Prisma, OrgType } from '@prisma/client';

@Injectable()
export class OrganizationsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new organization
     */
    async create(data: {
        name: string;
        code: string;
        type?: OrgType;
        parentId?: string;
        settings?: Prisma.InputJsonValue;
    }): Promise<Organization> {
        // Check code uniqueness
        const existing = await this.prisma.organization.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            throw new ConflictException(`Organization with code ${data.code} already exists`);
        }

        // Validate parent if provided
        if (data.parentId) {
            const parent = await this.prisma.organization.findUnique({
                where: { id: data.parentId },
            });
            if (!parent) {
                throw new NotFoundException('Parent organization not found');
            }
        }

        return this.prisma.organization.create({
            data: {
                name: data.name,
                code: data.code.toUpperCase(),
                type: data.type || OrgType.ENTITY,
                parentId: data.parentId,
                settings: data.settings,
            },
        });
    }

    /**
     * Find organization by ID
     */
    async findById(id: string): Promise<Organization | null> {
        return this.prisma.organization.findUnique({
            where: { id },
        });
    }

    /**
     * Find organization by code
     */
    async findByCode(code: string): Promise<Organization | null> {
        return this.prisma.organization.findUnique({
            where: { code: code.toUpperCase() },
        });
    }

    /**
     * Get all organizations (with optional filtering)
     */
    /**
     * Get all organizations (paginated with search)
     */
    async findAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
        type?: OrgType;
        parentId?: string | null;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.OrganizationWhereInput = {
            isActive: params.isActive,
            type: params.type,
            parentId: params.parentId,
            ...(params.search && {
                OR: [
                    { name: { contains: params.search, mode: 'insensitive' } },
                    { code: { contains: params.search, mode: 'insensitive' } },
                ],
            }),
        };

        const [total, data] = await Promise.all([
            this.prisma.organization.count({ where }),
            this.prisma.organization.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: { parent: true }
            }),
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
     * Get organization with children (hierarchy)
     */
    async findWithChildren(id: string) {
        return this.prisma.organization.findUnique({
            where: { id },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
                },
                parent: true,
            },
        });
    }

    /**
     * Update organization
     */
    async update(id: string, data: Prisma.OrganizationUpdateInput): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data,
        });
    }

    /**
     * Deactivate organization
     */
    async deactivate(id: string): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data: { isActive: false },
        });
    }

    /**
     * Get organization settings
     */
    async getSettings(id: string): Promise<Prisma.JsonValue | null> {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            select: { settings: true },
        });
        return org?.settings ?? null;
    }

    /**
     * Update organization settings
     */
    async updateSettings(id: string, settings: Prisma.InputJsonValue): Promise<Organization> {
        return this.prisma.organization.update({
            where: { id },
            data: { settings },
        });
    }
}
