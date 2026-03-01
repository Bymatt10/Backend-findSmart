import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

@Injectable()
export class CategoriesService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async findAll(userId: string) {
        const client = this.supabaseService.getClient();

        // Due to RLS, the service client (using service role key) bypasses RLS.
        // But since we want system + user, we can explicitly query it here.
        const { data, error } = await client
            .from('categories')
            .select('*')
            .or(`is_system.eq.true,user_id.eq.${userId}`)
            .order('name', { ascending: true });

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async create(userId: string, dto: CreateCategoryDto) {
        const client = this.supabaseService.getClient();

        // Check if a category with same name exists for this user or system
        const { data: existing } = await client
            .from('categories')
            .select('id')
            .eq('name', dto.name)
            .or(`is_system.eq.true,user_id.eq.${userId}`)
            .single();

        if (existing) {
            throw new BadRequestException('La categoría ya existe.');
        }

        const { data, error } = await client
            .from('categories')
            .insert({
                user_id: userId,
                name: dto.name,
                icon: dto.icon || '📌',
                is_system: false,
            })
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async update(userId: string, id: string, dto: UpdateCategoryDto) {
        const client = this.supabaseService.getClient();

        // Verify it belongs to user and is not a system category
        const { data: category } = await client
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (!category) throw new NotFoundException('Categoría no encontrada.');
        if (category.is_system) throw new BadRequestException('No puedes modificar categorías del sistema.');
        if (category.user_id !== userId) throw new BadRequestException('No cuentas con permisos.');

        const { data, error } = await client
            .from('categories')
            .update({
                name: dto.name,
                icon: dto.icon,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async remove(userId: string, id: string) {
        const client = this.supabaseService.getClient();

        // Verify it belongs to user and is not a system category
        const { data: category } = await client
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

        if (!category) throw new NotFoundException('Categoría no encontrada.');
        if (category.is_system) throw new BadRequestException('No puedes eliminar categorías del sistema.');
        if (category.user_id !== userId) throw new BadRequestException('No cuentas con permisos.');

        const { error } = await client
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw new InternalServerErrorException(error.message);
        return { success: true };
    }
}
