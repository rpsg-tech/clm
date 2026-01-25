/**
 * Organization Context Guard
 * 
 * Ensures user has selected an organization before accessing org-scoped resources.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

@Injectable()
export class OrgContextGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        if (!user.orgId) {
            throw new ForbiddenException(
                'Organization context required. Please select an organization using POST /api/v1/auth/switch-org',
            );
        }

        // Attach organization ID to request for easy access
        request.organizationId = user.orgId;

        return true;
    }
}
