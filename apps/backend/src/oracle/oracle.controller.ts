import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OracleService } from './oracle.service';
import { OracleChatRequestDto } from './dto/oracle-chat.dto';


@Controller('oracle')
@UseGuards(JwtAuthGuard)
export class OracleController {
    constructor(private readonly oracleService: OracleService) { }

    @Post('chat')
    // We strictly rely on JWT User context here.
    // We might add a permission like 'ai:interact' later.
    async chat(@Request() req, @Body() dto: OracleChatRequestDto) {
        const user = req.user;
        // user contains { id, email, role, organizational... } from JwtStrategy

        // We assume 'role' and 'organizationId' are available in the user object attached by guard
        // If not, we fetch them via UserService (omitted for scaffolding speed, relying on JWT payload or basic user obj)

        // Fallback if role is not directly on user (depends on Auth implementation)
        const role = user.role || 'viewer';
        // Prioritize client-provided Org ID (context-aware), fallback to user default
        const orgId = dto.organizationId || user.organizationId || 'org-default';

        return this.oracleService.handleChat(user.id, orgId, role, dto);
    }
}
