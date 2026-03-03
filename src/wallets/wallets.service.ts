import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallets.dto';

@Injectable()
export class WalletsService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async create(userId: string, dto: CreateWalletDto) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('wallets')
            .insert({
                user_id: userId,
                name: dto.name,
                type: dto.type,
                balance: dto.balance || 0,
                currency: dto.currency || 'NIO',
                icon: dto.icon || 'Wallet',
                bank_name: dto.bank_name || 'Efectivo',
                account_number: dto.account_number || null,
                credit_limit: dto.type === 'credit_card' ? (dto.credit_limit || 0) : null,
            })
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAll(userId: string) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async update(userId: string, id: string, dto: UpdateWalletDto) {
        const client = this.supabaseService.getClient();

        const { data: existing } = await client
            .from('wallets')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) throw new NotFoundException('Billetera no encontrada.');

        const { data, error } = await client
            .from('wallets')
            .update(dto)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async remove(userId: string, id: string) {
        const client = this.supabaseService.getClient();
        const { error } = await client
            .from('wallets')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new InternalServerErrorException(error.message);
        return { success: true };
    }
}
