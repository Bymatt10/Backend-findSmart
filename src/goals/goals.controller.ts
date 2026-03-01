import { Controller, Post, Body, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateProgressDto } from './dto/goals.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('goals')
@UseGuards(SupabaseAuthGuard)
export class GoalsController {
    constructor(private readonly goalsService: GoalsService) { }

    @Post()
    async createGoal(@Body() createDto: CreateGoalDto, @CurrentUser() user: User) {
        return this.goalsService.create(user.id, createDto);
    }

    @Get()
    async getGoals(@CurrentUser() user: User) {
        return this.goalsService.findAll(user.id);
    }

    @Patch(':id/progress')
    async updateProgress(
        @Param('id') id: string,
        @Body() updateDto: UpdateProgressDto,
        @CurrentUser() user: User
    ) {
        return this.goalsService.updateProgress(user.id, id, updateDto);
    }
}
