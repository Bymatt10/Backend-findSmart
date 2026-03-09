import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transactions.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('transactions')
@UseGuards(SupabaseAuthGuard)
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Get('summary')
    async getSummary(
        @CurrentUser() user: User,
        @Query('month') month?: number,
        @Query('year') year?: number,
    ) {
        return this.transactionsService.getSummary(user.id, month, year);
    }

    @Get()
    async getTransactions(
        @CurrentUser() user: User, 
        @Query('limit') limit = 50, 
        @Query('offset') offset = 0,
        @Query('month') month?: string,
        @Query('year') year?: string
    ) {
        return this.transactionsService.findAll(user.id, limit, offset, month, year);
    }

    @Get(':id')
    async getTransaction(@Param('id') id: string, @CurrentUser() user: User) {
        return this.transactionsService.findOne(user.id, id);
    }

    @Post()
    async createTransaction(@Body() dto: CreateTransactionDto, @CurrentUser() user: User) {
        return this.transactionsService.create(user.id, dto);
    }

    @Patch(':id')
    async updateTransaction(@Param('id') id: string, @Body() dto: UpdateTransactionDto, @CurrentUser() user: User) {
        return this.transactionsService.update(user.id, id, dto);
    }

    @Delete(':id')
    async removeTransaction(@Param('id') id: string, @CurrentUser() user: User) {
        return this.transactionsService.remove(user.id, id);
    }
}
