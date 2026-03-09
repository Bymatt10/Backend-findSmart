import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('reminders')
@UseGuards(SupabaseAuthGuard)
export class RemindersController {
    constructor(private readonly remindersService: RemindersService) { }

    @Post()
    async createReminder(@Body() dto: CreateReminderDto, @CurrentUser() user: User) {
        return this.remindersService.create(user.id, dto);
    }

    @Get()
    async getReminders(@CurrentUser() user: User) {
        return this.remindersService.findAll(user.id);
    }
}
