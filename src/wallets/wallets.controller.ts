import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallets.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('wallets')
@UseGuards(SupabaseAuthGuard)
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Post()
    create(@Body() createWalletDto: CreateWalletDto, @CurrentUser() user: User) {
        return this.walletsService.create(user.id, createWalletDto);
    }

    @Get()
    findAll(@CurrentUser() user: User) {
        return this.walletsService.findAll(user.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateWalletDto: UpdateWalletDto, @CurrentUser() user: User) {
        return this.walletsService.update(user.id, id, updateWalletDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        return this.walletsService.remove(user.id, id);
    }
}
