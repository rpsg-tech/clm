
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(@CurrentUser() user: AuthenticatedUser) {
        const [notifications, unreadCount] = await Promise.all([
            this.notificationsService.findAll(user.id),
            this.notificationsService.getUnreadCount(user.id),
        ]);

        return {
            notifications,
            unreadCount,
        };
    }

    @Patch('read-all')
    async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
        return this.notificationsService.markAllAsRead(user.id);
    }

    @Patch(':id/read')
    async markAsRead(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ) {
        return this.notificationsService.markAsRead(id, user.id);
    }
}
