/**
 * Users Service
 * 
 * Handles user-related operations.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../common/email/email.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private auditService: AuditService,
    ) { }

    /**
     * Find users by organization (Paginated)
     */
    async findAllByOrganization(organizationId: string, params: { page?: number; limit?: number; search?: string; status?: 'active' | 'pending' | 'all' }) {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const skip = (page - 1) * limit;

        const statusFilter = params.status || 'active';

        // Filter logic:
        // - active: isActive = true
        // - pending: isActive = false (assuming inactive means pending/disabled)
        // - all: no filter on isActive

        // Get child organizations to include in the list (Hierarchical view)
        const childOrgs = await this.prisma.organization.findMany({
            where: { parentId: organizationId },
            select: { id: true }
        });

        const orgIds = [organizationId, ...childOrgs.map(o => o.id)];

        const roleWhere: Prisma.UserOrganizationRoleWhereInput = {
            organizationId: { in: orgIds },
        };

        if (statusFilter === 'active') {
            roleWhere.isActive = true;
        } else if (statusFilter === 'pending') {
            roleWhere.isActive = false;
        }

        const where: Prisma.UserWhereInput = {
            organizationRoles: {
                some: roleWhere,
            },
            ...(params.search && {
                OR: [
                    { name: { contains: params.search, mode: 'insensitive' } },
                    { email: { contains: params.search, mode: 'insensitive' } },
                ],
            }),
        };

        const [total, data] = await Promise.all([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    organizationRoles: {
                        where: { isActive: true }, // Return ALL active roles, not just for this org
                        include: {
                            role: true,
                            organization: true
                        },
                    },
                },
                orderBy: { name: 'asc' },
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
     * Find ALL users (Global Admin) - Paginated
     */
    async findAll(params: { page?: number; limit?: number; search?: string }) {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            ...(params.search && {
                OR: [
                    { name: { contains: params.search, mode: 'insensitive' } },
                    { email: { contains: params.search, mode: 'insensitive' } },
                ],
            }),
        };

        const [total, data] = await Promise.all([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    organizationRoles: {
                        where: { isActive: true },
                        include: {
                            role: true,
                            organization: true
                        },
                    },
                },
                orderBy: { name: 'asc' },
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
     * Invite a new user to one or more organizations
     */
    async invite(
        organizationIds: string[],
        email: string,
        roleId: string,
        invitedByEmail: string,
        name?: string,
        manualPassword?: string,
        actorId?: string,
    ) {
        // Check if user exists
        let user = await this.prisma.user.findUnique({ where: { email } });
        let isNewUser = false;
        let password = manualPassword || '';

        const result = await this.prisma.$transaction(async (tx) => {
            if (!user) {
                isNewUser = true;
                // Create temp password if not provided
                if (!password) {
                    password = Math.random().toString(36).slice(-8) + 'A1!'; // Simple random password
                }
                const passwordHash = await bcrypt.hash(password, 12);

                user = await tx.user.create({
                    data: {
                        email,
                        name: name || email.split('@')[0],
                        passwordHash,
                    },
                });
            }

            // Assign to all selected organizations
            for (const organizationId of organizationIds) {
                await tx.userOrganizationRole.upsert({
                    where: {
                        userId_organizationId_roleId: {
                            userId: user.id,
                            organizationId,
                            roleId,
                        },
                    },
                    update: { isActive: true }, // Re-activate if previously added
                    create: {
                        userId: user.id,
                        organizationId,
                        roleId,
                    },
                });
            }

            // Get organization names for email
            const orgs = await tx.organization.findMany({
                where: { id: { in: organizationIds } },
                select: { name: true },
            });
            const orgNames = orgs.map(o => o.name).join(', ');

            // Send email
            if (isNewUser) {
                await this.emailService.send({
                    to: email,
                    template: 'WELCOME' as any,
                    subject: 'Welcome to CLM Enterprise',
                    data: {
                        userName: name,
                        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
                        invitedBy: invitedByEmail,
                        tempPassword: password,
                        organizations: orgNames,
                    },
                });
            } else {
                await this.emailService.send({
                    to: email,
                    template: 'GENERIC_NOTIFICATION' as any,
                    subject: 'New Organization Access',
                    data: {
                        title: 'New Organization Access',
                        message: `You have been granted access to ${organizationIds.length} organization(s) in CLM Enterprise by ${invitedByEmail}: ${orgNames}`,
                        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/select-org`,
                        actionText: 'Select Organization',
                    },
                });
            }

            return user;
        });

        // Audit Logging
        if (actorId && isNewUser) {
            await this.auditService.log({
                module: AuditService.Modules.USERS,
                action: AuditService.Actions.USER_CREATED,
                userId: actorId,
                targetId: result.id,
                organizationId: organizationIds[0], // Primary org context
                metadata: { email, name, organizationIds, roleId }
            });
        } else if (actorId && !isNewUser) {
            await this.auditService.log({
                module: AuditService.Modules.USERS,
                action: AuditService.Actions.ROLE_ASSIGNED,
                userId: actorId,
                targetId: result.id,
                organizationId: organizationIds[0],
                metadata: { email, organizationIds, roleId }
            });
        }

        return result;
    }

    /**
     * Update user role or status within an organization
     */
    async updateUserInOrg(
        userId: string,
        organizationId: string,
        data: { roleId?: string; isActive?: boolean },
        actorId?: string, // Admin performing the action
    ) {
        // Find current role mapping
        const currentMapping = await this.prisma.userOrganizationRole.findFirst({
            where: { userId, organizationId, isActive: true },
        });

        let action = '';
        let oldRole = currentMapping?.roleId;

        // If not found, we create a new one (acting as an assignment)
        if (!currentMapping) {
            action = AuditService.Actions.ROLE_ASSIGNED;
            await this.prisma.userOrganizationRole.upsert({
                where: {
                    userId_organizationId_roleId: {
                        userId,
                        organizationId,
                        roleId: data.roleId!, // Role ID is required
                    }
                },
                update: {
                    isActive: true
                },
                create: {
                    userId,
                    organizationId,
                    roleId: data.roleId!,
                    isActive: true
                }
            });
        } else {
            if (data.roleId && data.roleId !== currentMapping.roleId) {
                action = AuditService.Actions.ROLE_ASSIGNED;
                // Deactivate old role mapping
                await this.prisma.userOrganizationRole.update({
                    where: {
                        userId_organizationId_roleId: {
                            userId,
                            organizationId,
                            roleId: currentMapping.roleId
                        }
                    },
                    data: { isActive: false }
                });

                // Create new or activate existing
                await this.prisma.userOrganizationRole.upsert({
                    where: {
                        userId_organizationId_roleId: {
                            userId,
                            organizationId,
                            roleId: data.roleId
                        }
                    },
                    update: {
                        isActive: true
                    },
                    create: {
                        userId,
                        organizationId,
                        roleId: data.roleId,
                        isActive: true
                    }
                });
            } else if (data.isActive !== undefined) {
                if (data.isActive === false) {
                    action = AuditService.Actions.ROLE_REMOVED;
                } else {
                    action = AuditService.Actions.ROLE_ASSIGNED; // Reactivation
                }
                await this.prisma.userOrganizationRole.updateMany({
                    where: { userId, organizationId },
                    data: { isActive: data.isActive }
                });
            }
        }

        // Audit Log
        if (action && actorId) {
            await this.auditService.log({
                userId: actorId, // Who performed the action
                organizationId,
                action,
                module: 'USERS',
                targetType: 'USER',
                targetId: userId,
                oldValue: { roleId: oldRole },
                newValue: { roleId: data.roleId, isActive: data.isActive },
                metadata: {
                    affectedUserId: userId,
                    changeType: 'ORGANIZATION_MEMBERSHIP'
                }
            });
        }

        return this.findById(userId);
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    /**
     * Find user by ID
     */
    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    /**
     * Create a new user
     */
    async create(data: {
        email: string;
        password: string;
        name: string;
        phone?: string;
    }): Promise<User> {
        const passwordHash = await bcrypt.hash(data.password, 12);

        return this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                name: data.name,
                phone: data.phone,
            },
        });
    }

    /**
     * Update user
     */
    async update(id: string, data: Prisma.UserUpdateInput, actorId?: string): Promise<User> {
        const result = await this.prisma.user.update({
            where: { id },
            data,
        });

        if (actorId) {
            await this.auditService.log({
                module: AuditService.Modules.USERS,
                action: AuditService.Actions.USER_UPDATED,
                userId: actorId,
                targetId: id,
                metadata: { changedFields: Object.keys(data) }
            });
        }

        return result;
    }

    /**
     * Deactivate user
     */
    async deactivate(id: string, actorId?: string): Promise<User> {
        const result = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });

        if (actorId) {
            await this.auditService.log({
                module: AuditService.Modules.USERS,
                action: AuditService.Actions.USER_DEACTIVATED,
                userId: actorId,
                targetId: id
            });
        }

        return result;
    }

    /**
     * Get user with organization roles
     */
    async findWithRoles(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                organizationRoles: {
                    where: { isActive: true },
                    include: {
                        organization: true,
                        role: {
                            include: {
                                permissions: {
                                    include: { permission: true },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
}
