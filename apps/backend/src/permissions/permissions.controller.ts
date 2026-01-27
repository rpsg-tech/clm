import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) { }

    @Get()
    @ApiOperation({ summary: 'List all permissions' })
    @ApiResponse({ status: 200, description: 'Returns all permissions grouped by module' })
    async findAll() {
        return this.permissionsService.findAllGrouped();
    }
}
