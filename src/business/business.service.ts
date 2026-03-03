import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBusinessTransactionDto } from './dto/create-business-transaction.dto';
import { UpdateBusinessTransactionDto } from './dto/update-business-transaction.dto';

@Injectable()
export class BusinessService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async create(userId: string, dto: CreateBusinessTransactionDto) {
        const client = this.supabaseService.getClient();

        // Calculate status correctly based on whether sell_price is provided
        const finalStatus = (dto.status === 'sold' || dto.sell_price !== undefined) ? 'sold' : 'bought';

        const { data, error } = await client
            .from('business_transactions')
            .insert({
                user_id: userId,
                product_name: dto.product_name,
                description: dto.description || null,
                buy_cost: dto.buy_cost,
                extra_costs: dto.extra_costs || 0,
                extra_costs_detail: dto.extra_costs_detail || null,
                sell_price: dto.sell_price || null,
                status: finalStatus,
                currency: dto.currency || 'NIO',
                buy_date: dto.buy_date || new Date().toISOString(),
                sell_date: dto.sell_date || (finalStatus === 'sold' ? new Date().toISOString() : null),
                goal_id: dto.goal_id || null
            })
            .select()
            .single();

        if (error) {
            console.error('Error insertando business transaction:', error);
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }

    async findAll(userId: string, limit = 50, offset = 0) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('business_transactions')
            .select('*, goals(id, title)')
            .eq('user_id', userId)
            .order('buy_date', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findOne(userId: string, id: string) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('business_transactions')
            .select('*, goals(id, title)')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !data) throw new NotFoundException('Transacción de negocio no encontrada.');
        return data;
    }

    async update(userId: string, id: string, dto: UpdateBusinessTransactionDto) {
        const client = this.supabaseService.getClient();

        const { data: existing } = await client
            .from('business_transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) throw new NotFoundException('Transacción de negocio no encontrada.');

        let updateData: any = { ...dto };

        if (dto.status !== undefined) {
            updateData.status = dto.status;
        } else if (dto.sell_price !== undefined && dto.sell_price !== null) {
            updateData.status = 'sold';
        }

        if (updateData.status === 'sold') {
            if (!updateData.sell_date && existing.status !== 'sold') {
                updateData.sell_date = new Date().toISOString();
            }
        } else if (updateData.status === 'bought') {
            updateData.sell_price = null;
            updateData.sell_date = null;
        }

        const { data, error } = await client
            .from('business_transactions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async remove(userId: string, id: string) {
        const client = this.supabaseService.getClient();
        const { error } = await client
            .from('business_transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new InternalServerErrorException(error.message);
        return { success: true };
    }

    async getStats(userId: string) {
        const client = this.supabaseService.getClient();

        const { data: allTransactions, error } = await client
            .from('business_transactions')
            .select('*')
            .eq('user_id', userId);

        if (error) throw new InternalServerErrorException(error.message);

        let totalInvested = 0;
        let totalSold = 0;
        let netProfit = 0;
        let inventoryValue = 0; // Value of products not yet sold
        const profitByMonth: Record<string, number> = {};

        for (const t of allTransactions as any[]) {
            const totalCost = Number(t.buy_cost) + Number(t.extra_costs);
            totalInvested += totalCost;

            if (t.status === 'sold') {
                totalSold += Number(t.sell_price);
                const profit = Number(t.sell_price) - totalCost;
                netProfit += profit;

                const monthKey = t.sell_date ? t.sell_date.substring(0, 7) : t.buy_date.substring(0, 7); // YYYY-MM
                profitByMonth[monthKey] = (profitByMonth[monthKey] || 0) + profit;
            } else {
                inventoryValue += totalCost;
            }
        }

        return {
            totalInvested,
            totalSold,
            netProfit,
            inventoryValue,
            profitByMonth
        };
    }
}
