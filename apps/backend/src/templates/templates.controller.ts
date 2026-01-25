/**
 * Templates Controller
 */

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../auth/guards/org-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('templates')
@UseGuards(JwtAuthGuard, OrgContextGuard, PermissionsGuard)
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) { }

    @Get()
    @Permissions('template:view')
    async findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.templatesService.findForOrganization(user.orgId!);
    }

    @Get(':id')
    @Permissions('template:view')
    async findOne(@Param('id') id: string) {
        return this.templatesService.findById(id);
    }
}
