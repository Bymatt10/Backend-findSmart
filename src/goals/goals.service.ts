import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateGoalDto, UpdateProgressDto } from './dto/goals.dto';

@Injectable()
export class GoalsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async create(userId: string, dto: CreateGoalDto) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('goals')
            .insert({
                user_id: userId,
                title: dto.title,
                target_amount: dto.target_amount,
                target_currency: dto.target_currency || 'NIO',
                deadline: dto.deadline,
                current_amount: 0,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAll(userId: string) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async updateProgress(userId: string, id: string, dto: UpdateProgressDto) {
        const client = this.supabaseService.getClient();

        // 1. Fetch current goal
        const { data: currentGoal, error: fetchError } = await client
            .from('goals')
            .select('current_amount, target_amount')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !currentGoal) throw new NotFoundException('Goal not found');

        const newAmount = Number(currentGoal.current_amount) + Number(dto.amount_to_add);
        const newStatus = newAmount >= currentGoal.target_amount ? 'completed' : 'active';

        // 2. Update it
        const { data: updated, error: updateError } = await client
            .from('goals')
            .update({
                current_amount: newAmount,
                status: newStatus
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (updateError) throw new InternalServerErrorException(updateError.message);
        return updated;
    }
}
