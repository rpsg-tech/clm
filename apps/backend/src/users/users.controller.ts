
import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Permissions('user:view')
    async listUsers(
        @CurrentUser() user: AuthenticatedUser,
        @Query() query: PaginationDto & { status?: 'active' | 'pending' | 'all' },
    ) {
        let result;

        // If user has organization context, we can filter by that
        if (user.orgId) {
            result = await this.usersService.findAllByOrganization(user.orgId, query);
        } else {
            // If no org context, we assume Global Admin view (Super Admin)
            result = await this.usersService.findAll(query);
        }

        return {
            data: this.transformUsers(result.data),
            meta: result.meta,
        };
    }

    private transformUsers(users: any[]) {
        return users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.organizationRoles[0]?.role?.name || 'No Role', // Simplified for list
            roleId: u.organizationRoles[0]?.roleId,
            isActive: u.organizationRoles[0]?.isActive ?? false,
            lastActive: u.lastLoginAt,
            organizations: u.organizationRoles?.map((orgRole: any) => ({
                id: orgRole.organization.id,
                name: orgRole.organization.name,
                code: orgRole.organization.code,
            })) || [],
        }));
    }

    @Post('invite')
    @Permissions('user:manage')
    async inviteUser(
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { email: string; roleId: string; organizationIds?: string[]; name?: string; password?: string },
    ) {
        // Use provided org IDs or default to current user's org if available
        const orgIds = body.organizationIds && body.organizationIds.length > 0
            ? body.organizationIds
            : (user.orgId ? [user.orgId] : []);

        if (orgIds.length === 0) {
            // If still no org, but user is admin, allow it (will create user without initial org)
            // or just allow the service to handle it
        }

        return this.usersService.invite(
            orgIds,
            body.email,
            body.roleId,
            user.email,
            body.name,
            body.password,
            user.id, // Audit
        );
    }

    @Patch(':id')
    @Permissions('user:manage')
    async updateUser(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') userId: string,
        @Body() body: {
            name?: string;
            email?: string;
            roleId?: string;
            isActive?: boolean;
            organizationIds?: string[];
        },
    ) {

        // Update user basic info if provided
        if (body.name || body.email) {
            await this.usersService.update(userId, {
                name: body.name,
                email: body.email,
            }, user.id);
        }

        // Handle organization changes if provided
        // Handle organization changes if provided
        if (body.organizationIds && body.roleId) {
            // Get current user organizations
            const currentUser = await this.usersService.findWithRoles(userId);
            const currentOrgIds = currentUser?.organizationRoles
                ?.filter(r => r.isActive)
                .map(r => r.organizationId) || [];

            // Add to new organizations
            const orgsToAdd = body.organizationIds.filter(id => !currentOrgIds.includes(id));
            for (const orgId of orgsToAdd) {
                await this.usersService.updateUserInOrg(
                    userId,
                    orgId,
                    {
                        roleId: body.roleId,
                        isActive: true,
                    },
                    user.id // Actor ID for audit
                );
            }

            // Remove from unselected organizations (only if admin manages those orgs)
            // Ideally we check if 'user' has permission for these orgs too
            const orgsToRemove = currentOrgIds.filter(id => !body.organizationIds!.includes(id));
            for (const orgId of orgsToRemove) {
                await this.usersService.updateUserInOrg(
                    userId,
                    orgId,
                    {
                        isActive: false,
                    },
                    user.id // Actor ID for audit
                );
            }
        } else if (user.orgId && (body.roleId !== undefined || body.isActive !== undefined)) {
            // Legacy: Update role/status within current organization only
            await this.usersService.updateUserInOrg(
                userId,
                user.orgId,
                {
                    roleId: body.roleId,
                    isActive: body.isActive,
                },
                user.id // Actor ID for audit
            );
        }

        // Return updated user
        const updatedUser = await this.usersService.findById(userId);
        return {
            id: updatedUser?.id,
            name: updatedUser?.name,
            email: updatedUser?.email,
            message: 'User updated successfully',
        };
    }
}
