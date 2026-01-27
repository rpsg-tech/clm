/**
 * Organizations Controller
 * 
 * Admin endpoints for organization management.
 */

import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Body,
    UseGuards,
    Query,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Post()
    @Permissions('org:create')
    async create(@Body() createDto: CreateOrganizationDto) {
        return this.organizationsService.create({
            ...createDto,
            settings: createDto.settings as Prisma.InputJsonValue,
        });
    }

    @Get()
    @Permissions('org:view')
    async findAll(
        @Query() query: PaginationDto,
        @Query('isActive') isActive?: boolean,
        @Query('type') type?: 'PARENT' | 'ENTITY',
    ) {
        return this.organizationsService.findAll({
            ...query,
            isActive,
            type: type as any,
        });
    }

    @Get(':id')
    @Permissions('org:view')
    async findOne(@Param('id') id: string) {
        return this.organizationsService.findWithChildren(id);
    }

    @Put(':id')
    @Permissions('org:edit')
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateOrganizationDto,
    ) {
        return this.organizationsService.update(id, {
            name: updateDto.name,
            code: updateDto.code,
            type: updateDto.type,
            parentId: updateDto.parentId,
            isActive: updateDto.isActive,
            settings: updateDto.settings as Prisma.InputJsonValue,
        } as Prisma.OrganizationUpdateInput);
    }

    @Put(':id/settings')
    @Permissions('org:edit')
    async updateSettings(
        @Param('id') id: string,
        @Body() settings: Record<string, unknown>,
    ) {
        return this.organizationsService.updateSettings(id, settings as Prisma.InputJsonValue);
    }

    @Put(':id/deactivate')
    @Permissions('org:delete')
    async deactivate(@Param('id') id: string) {
        return this.organizationsService.deactivate(id);
    }
}
