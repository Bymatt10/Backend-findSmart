import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('categories')
@UseGuards(SupabaseAuthGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    async getCategories(@CurrentUser() user: User) {
        return this.categoriesService.findAll(user.id);
    }

    @Post()
    async createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() user: User) {
        return this.categoriesService.create(user.id, dto);
    }

    @Patch(':id')
    async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentUser() user: User) {
        return this.categoriesService.update(user.id, id, dto);
    }

    @Delete(':id')
    async removeCategory(@Param('id') id: string, @CurrentUser() user: User) {
        return this.categoriesService.remove(user.id, id);
    }
}
