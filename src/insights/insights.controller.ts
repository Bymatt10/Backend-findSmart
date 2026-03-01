import { Controller, Get, Post, Patch, Param, UseGuards, Body } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('insights')
@UseGuards(SupabaseAuthGuard)
export class InsightsController {
    constructor(private readonly insightsService: InsightsService) { }

    @Get()
    async getInsights(@CurrentUser() user: User) {
        return this.insightsService.findAll(user.id);
    }

    @Get('dashboard')
    async getDashboardInsights(@CurrentUser() user: User) {
        return this.insightsService.generateDashboard(user.id);
    }

    @Post('chat')
    async processChat(@Body() body: { message: string, history: any[] }, @CurrentUser() user: User) {
        console.log(`[InsightsController] Chat request received from user ${user.id}`);
        return this.insightsService.handleChatMessage(user.id, body);
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
        return this.insightsService.markAsRead(user.id, id);
    }
}
