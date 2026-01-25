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

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * Find users by organization
     */
    async findAllByOrganization(organizationId: string) {
        return this.prisma.user.findMany({
            where: {
                organizationRoles: {
                    some: { organizationId, isActive: true },
                },
            },
            include: {
                organizationRoles: {
                    where: { isActive: true }, // Get ALL orgs, not just current one
                    include: {
                        role: true,
                        organization: true  // Include organization details
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Find ALL users (Global Admin)
     */
    async findAll() {
        return this.prisma.user.findMany({
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
        });
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
    ) {
        // Check if user exists
        let user = await this.prisma.user.findUnique({ where: { email } });
        let isNewUser = false;
        let password = '';

        return this.prisma.$transaction(async (tx) => {
            if (!user) {
                isNewUser = true;
                // Create temp password
                password = Math.random().toString(36).slice(-8) + 'A1!'; // Simple random password
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
    }

    /**
     * Update user role or status within an organization
     */
    async updateUserInOrg(
        userId: string,
        organizationId: string,
        data: { roleId?: string; isActive?: boolean },
    ) {
        // Find current role mapping
        const currentMapping = await this.prisma.userOrganizationRole.findFirst({
            where: { userId, organizationId, isActive: true },
        });

        // If not found, we create a new one (acting as an assignment)
        if (!currentMapping) {
            return this.prisma.userOrganizationRole.create({
                data: {
                    userId,
                    organizationId,
                    roleId: data.roleId!, // Role ID is required for creation
                    isActive: true
                }
            }).then(() => this.findById(userId));
        }

        if (data.roleId && data.roleId !== currentMapping.roleId) {
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
            await this.prisma.userOrganizationRole.create({
                data: {
                    userId,
                    organizationId,
                    roleId: data.roleId,
                    isActive: true
                }
            });
        }

        if (data.isActive !== undefined) {
            await this.prisma.userOrganizationRole.updateMany({
                where: { userId, organizationId },
                data: { isActive: data.isActive }
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
    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    /**
     * Deactivate user
     */
    async deactivate(id: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
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
