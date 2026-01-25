/**
 * Permissions Guard
 * 
 * Checks if user has required permissions for the route.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If no permissions are required, allow access
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Check if user has organization context
        if (!user.orgId) {
            throw new ForbiddenException('Organization context required. Please select an organization.');
        }

        // Check if user has at least one required permission
        const hasPermission = requiredPermissions.some((permission) =>
            user.permissions.includes(permission),
        );

        if (!hasPermission) {
            throw new ForbiddenException(
                `Missing required permission: ${requiredPermissions.join(' or ')}`,
            );
        }

        return true;
    }
}
