import { Body, Controller, Get, Post, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OracleService } from './oracle.service';
import { OracleChatRequestDto } from './dto/oracle-chat.dto';
import { OracleRateLimiterService } from './services/oracle-rate-limiter.service';


@Controller('oracle')
@UseGuards(JwtAuthGuard)
export class OracleController {
    constructor(
        private readonly oracleService: OracleService,
        private readonly rateLimiter: OracleRateLimiterService
    ) { }

    @Post('chat')
    async chat(@Request() req, @Body() dto: OracleChatRequestDto) {
        const user = req.user;
        const userId = user.id;

        // Use organizationId from DTO, or from user object
        const orgId = dto.organizationId || user.orgId;

        if (!orgId) {
            throw new BadRequestException('Organization ID is required');
        }

        // Get permissions from user object (should be populated by JWT strategy)
        const permissions: string[] = user.permissions || [];

        return this.oracleService.handleChat(userId, orgId, permissions, dto);
    }

    @Get('usage')
    async getUsage(@Request() req) {
        const { id: userId } = req.user;
        return this.rateLimiter.getUsage(userId);
    }
}
