import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ClassificationService } from '../classification/classification.service';
import { CurrencyService } from '../currency/currency.service';
import { CreateTransactionDto, UpdateTransactionDto } from './dto/transactions.dto';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly classificationService: ClassificationService,
        private readonly currencyService: CurrencyService
    ) { }

    async create(userId: string, dto: CreateTransactionDto) {
        const client = this.supabaseService.getClient();

        // 1. Resolve Category
        let categoryId = dto.category_id;
        if (!categoryId && dto.merchant_name) {
            // Fetch available categories for this user 
            const { data: availableCategories } = await client
                .from('categories')
                .select('id, name')
                .or(`is_system.eq.true,user_id.eq.${userId}`);

            categoryId = await this.classificationService.categorizeTransaction(
                dto.merchant_name,
                dto.amount,
                availableCategories || []
            );
        }

        // 2. Fetch exchange rate if currency is not default, or always fetch today's rate just in case
        let rate = 1;
        try {
            rate = await this.currencyService.getTodayRate();
        } catch (e) {
            // ignore error, will default to 1 or fallback
        }

        const amountNio = dto.original_currency === 'USD' ? dto.amount * rate : dto.amount;

        const { data, error } = await client
            .from('transactions')
            .insert({
                user_id: userId,
                amount: dto.original_currency === 'USD' ? amountNio : dto.amount,
                date: dto.date,
                description: dto.description,
                merchant_name: dto.merchant_name,
                category_id: categoryId || null,
                original_currency: dto.original_currency || 'NIO',
                exchange_rate: rate,
                source: dto.source || 'manual'
            })
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findAll(userId: string, limit = 50, offset = 0, month?: string, year?: string) {
        const client = this.supabaseService.getClient();

        let query = client
            .from('transactions')
            .select(`
                *,
                categories (id, name, icon)
            `)
            .eq('user_id', userId);

        if (year && month) {
            const y = typeof year === 'string' ? parseInt(year) : year;
            const m = typeof month === 'string' ? parseInt(month) : month;
            const lastDay = new Date(y, m, 0).getDate();
            const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
            const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            query = query.gte('date', startStr).lte('date', endStr);
        }

        const { data, error } = await query
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async findOne(userId: string, id: string) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('transactions')
            .select('*, categories(id, name, icon)')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !data) throw new NotFoundException('Transacción no encontrada.');
        return data;
    }

    async update(userId: string, id: string, dto: UpdateTransactionDto) {
        const client = this.supabaseService.getClient();

        // Check ownership
        const { data: existing } = await client
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!existing) throw new NotFoundException('Transacción no encontrada.');

        let updateData: any = { ...dto };

        // Handle currency recalc if amount or currency is updated
        if (dto.amount !== undefined || dto.original_currency !== undefined) {
            const currentAmount = dto.amount ?? existing.amount;
            // if we are updating original_currency we should recalculate the base NIO amount if needed, 
            // but for simplicity MVP we use the same exchange rate originally recorded
            const rate = existing.exchange_rate || 36.62;
            const currency = dto.original_currency ?? existing.original_currency;

            updateData.amount = currency === 'USD' ? currentAmount * rate : currentAmount;
        }

        const { data, error } = await client
            .from('transactions')
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
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new InternalServerErrorException(error.message);
        return { success: true };
    }

    async getSummary(userId: string, month?: number, year?: number) {
        const client = this.supabaseService.getClient();

        let query = client.from('transactions').select('amount, categories(name)').eq('user_id', userId);

        if (year && month) {
            const y = typeof year === 'string' ? parseInt(year) : year;
            const m = typeof month === 'string' ? parseInt(month) : month;
            const lastDay = new Date(y, m, 0).getDate();
            const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
            const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            query = query.gte('date', startStr).lte('date', endStr);
        }

        // This is a simplified fetch, ideally Supabase RPC would be better here for large datasets,
        // but since we only have limit filters, let's pull all for the context.
        const { data: allTransactions, error } = await query;
        if (error) throw new InternalServerErrorException(error.message);

        let totalIncome = 0;
        let totalExpense = 0;
        const byCategory: Record<string, number> = {};

        // In MVP, we consider amount > 0 as income, amount < 0 as expense
        for (const t of allTransactions as any[]) {
            const val = Number(t.amount);
            if (val > 0) totalIncome += val;
            if (val < 0) totalExpense += val;

            const catName = t.categories?.name || 'Sin Categoria';
            if (!byCategory[catName]) byCategory[catName] = 0;
            byCategory[catName] += val;
        }

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome + totalExpense,
            byCategory
        };
    }
}
