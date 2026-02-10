import { AuditService } from '../audit/audit.service';
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query, ForbiddenException, NotFoundException, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrgContextGuard } from './guards/org-context.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './strategies/jwt.strategy';

@Controller('roles')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class RolesController {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService
    ) { }

    /**
     * List all roles (global roles available to all organizations)
     */
    @Get()
    @Permissions('role:view', 'admin:user:manage')
    async listRoles(
        @Query() query: PaginationDto
    ) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.RoleWhereInput = {
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { code: { contains: query.search, mode: 'insensitive' } },
                    { description: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
        };

        const [total, roles] = await Promise.all([
            this.prisma.role.count({ where }),
            this.prisma.role.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    permissions: {
                        include: { permission: true }
                    }
                }
            })
        ]);

        return {
            data: roles.map(role => ({
                id: role.id,
                name: role.name,
                code: role.code,
                description: role.description,
                isSystem: role.isSystem,
                permissionCount: role.permissions.length,
                permissions: role.permissions.map(rp => rp.permission.code)
            })),
            meta: {
                total,
                lastPage: Math.ceil(total / limit),
                currentPage: page,
                perPage: limit,
                prev: page > 1 ? page - 1 : null,
                next: page < Math.ceil(total / limit) ? page + 1 : null,
            }
        };
    }

    /**
     * Get a single role by ID with full permission details
     */
    @Get(':id')
    @Permissions('role:view', 'admin:user:manage')
    async getRole(@Param('id') id: string) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        return {
            id: role.id,
            name: role.name,
            code: role.code,
            description: role.description,
            isSystem: role.isSystem,
            permissions: role.permissions.map(rp => ({
                id: rp.permission.id,
                code: rp.permission.code,
                name: rp.permission.name,
                module: rp.permission.module
            }))
        };
    }

    /**
     * Create a new custom role
     */
    @Post()
    @Permissions('role:manage')
    async create(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { name: string; code: string; description?: string; permissionIds: string[] }
    ) {
        const { name, code, description, permissionIds } = body;

        // Check if code already exists
        const existing = await this.prisma.role.findUnique({ where: { code } });
        if (existing) {
            throw new ForbiddenException('Role code already exists');
        }

        const role = await this.prisma.role.create({
            data: {
                name,
                code,
                description,
                isSystem: false,
                permissions: {
                    create: permissionIds.map(permissionId => ({ permissionId }))
                }
            },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        });

        // Log Audit
        await this.auditService.log({
            module: AuditService.Modules.ROLES,
            action: AuditService.Actions.ROLE_CREATED,
            userId: user.id,
            targetId: role.id,
            organizationId: user.orgId,
            metadata: { name, code, description, permissionIds }
        });

        return {
            id: role.id,
            name: role.name,
            code: role.code,
            description: role.description,
            isSystem: role.isSystem,
            permissions: role.permissions.map(rp => rp.permission.code)
        };
    }

    @Patch(':id')
    @Permissions('role:manage')
    async update(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; permissionIds?: string[] }
    ) {
        const role = await this.prisma.role.findUnique({ where: { id } });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

        // Check if user is SUPER_ADMIN
        const userOrgRole = await this.prisma.userOrganizationRole.findFirst({
            where: {
                userId: user.id,
                organizationId: user.orgId,
                isActive: true
            },
            include: { role: true }
        });

        const isSuperAdmin = userOrgRole?.role.code === 'SUPER_ADMIN';

        if (role.isSystem && !isSuperAdmin) {
            throw new ForbiddenException('System roles cannot be modified');
        }

        const { name, description, permissionIds } = body;

        // Update role and permissions in transaction
        const updatedRole = await this.prisma.$transaction(async (tx) => {
            // Update role basic info
            const updated = await tx.role.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(description !== undefined && { description })
                }
            });

            // If permissions are provided, replace them
            if (permissionIds) {
                // Delete existing permissions
                await tx.rolePermission.deleteMany({ where: { roleId: id } });

                // Create new permissions
                await tx.rolePermission.createMany({
                    data: permissionIds.map(permissionId => ({ roleId: id, permissionId }))
                });
            }

            return updated;
        });

        // Fetch updated role with permissions
        const result = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: { permission: true }
                }
            }
        });

        // Log Audit
        await this.auditService.log({
            module: AuditService.Modules.ROLES,
            action: AuditService.Actions.ROLE_UPDATED,
            userId: user.id,
            targetId: id,
            organizationId: user.orgId,
            metadata: { name, description, permissionIds }
        });

        return {
            id: result!.id,
            name: result!.name,
            code: result!.code,
            description: result!.description,
            isSystem: result!.isSystem,
            permissions: result!.permissions.map(rp => rp.permission.code)
        };
    }
}

/**
 * Permissions Controller - Lists all available system permissions
 */
@Controller('permissions')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class PermissionsController {
    constructor(private prisma: PrismaService) { }

    @Get()
    @Permissions('role:view', 'admin:user:manage')
    async listPermissions() {
        const permissions = await this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { name: 'asc' }]
        });

        // Group by module for easier frontend rendering
        const grouped: Record<string, any[]> = {};
        permissions.forEach(p => {
            if (!grouped[p.module]) {
                grouped[p.module] = [];
            }
            grouped[p.module].push({
                id: p.id,
                code: p.code,
                name: p.name,
                description: p.description
            });
        });

        return {
            permissions,
            grouped
        };
    }
}
