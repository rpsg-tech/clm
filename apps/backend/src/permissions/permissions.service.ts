/**
 * Permissions Service
 * 
 * Handles role and permission management.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Permission } from '@prisma/client';

@Injectable()
export class PermissionsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all roles
     */
    async getAllRoles(): Promise<Role[]> {
        return this.prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Get role by ID
     */
    async getRoleById(id: string) {
        return this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
    }

    /**
     * Get all permissions
     */
    async getAllPermissions(): Promise<Permission[]> {
        return this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { name: 'asc' }],
        });
    }

    /**
     * Get permissions by module
     */
    async getPermissionsByModule(module: string): Promise<Permission[]> {
        return this.prisma.permission.findMany({
            where: { module },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Get all permissions grouped by module
     */
    async findAllGrouped() {
        const permissions = await this.getAllPermissions();

        // Group by module
        const grouped: Record<string, Permission[]> = {};

        for (const p of permissions) {
            if (!grouped[p.module]) {
                grouped[p.module] = [];
            }
            grouped[p.module].push(p);
        }

        return {
            list: permissions,
            grouped
        };
    }

    /**
     * Assign role to user in organization
     */
    async assignRole(userId: string, organizationId: string, roleId: string, assignedBy?: string) {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) {
            throw new NotFoundException('Role not found');
        }

        return this.prisma.userOrganizationRole.upsert({
            where: {
                userId_organizationId_roleId: {
                    userId,
                    organizationId,
                    roleId,
                },
            },
            update: {
                isActive: true,
                assignedBy,
                assignedAt: new Date(),
            },
            create: {
                userId,
                organizationId,
                roleId,
                assignedBy,
            },
        });
    }

    /**
     * Remove role from user in organization
     */
    async removeRole(userId: string, organizationId: string, roleId: string) {
        return this.prisma.userOrganizationRole.updateMany({
            where: {
                userId,
                organizationId,
                roleId,
            },
            data: { isActive: false },
        });
    }

    /**
     * Get user permissions for an organization
     */
    async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
        const userRoles = await this.prisma.userOrganizationRole.findMany({
            where: {
                userId,
                organizationId,
                isActive: true,
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });

        // Collect all unique permission codes
        const permissionSet = new Set<string>();
        for (const ur of userRoles) {
            for (const rp of ur.role.permissions) {
                permissionSet.add(rp.permission.code);
            }
        }

        return Array.from(permissionSet);
    }

    /**
     * Check if user has specific permission in organization
     */
    async hasPermission(userId: string, organizationId: string, permission: string): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId, organizationId);
        return permissions.includes(permission);
    }
}
