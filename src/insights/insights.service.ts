import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class InsightsService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly geminiService: GeminiService
    ) { }

    async findAll(userId: string) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('ai_insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async markAsRead(userId: string, id: string) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('ai_insights')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    // Triggered via User Request -> generates and caches structured dashboard for 6 hours
    async generateDashboard(userId: string) {
        const client = this.supabaseService.getClient();

        // 1. Fetch Goals to include in dashboard natively
        const { data: goals } = await client
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active');

        // 2. Fetch last 30 days of transactions for context
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: transactions } = await client
            .from('transactions')
            .select('amount, date, merchant_name, category_id, original_currency')
            .eq('user_id', userId)
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

        // Basic payload for Gemini
        const userData = {
            recentTransactionsCount: transactions?.length || 0,
            recentTransactionsSample: transactions?.slice(0, 20) || [],
            activeGoalsCount: goals?.length || 0,
            goals: goals?.map(g => ({ title: g.title, progress: g.current_amount / g.target_amount })) || []
        };

        // 3. Call Gemini
        let aiDashboard = await this.geminiService.generateDashboardInsights(userData);

        // Fallback if Gemini fails or times out
        if (!aiDashboard) {
            aiDashboard = {
                dailyInsight: {
                    text: "Sigue registrando tus gastos para ver sugerencias detalladas aquí.",
                    type: "saving_tip"
                },
                trends: [],
                alerts: [],
                recommendedAction: null
            };
        }

        // Return combined structured response
        return {
            dailyInsight: aiDashboard.dailyInsight,
            trends: aiDashboard.trends || [],
            alerts: aiDashboard.alerts || [],
            goals: goals || [],
            recommendedAction: aiDashboard.recommendedAction
        };
    }

    async handleChatMessage(userId: string, body: { message: string, history: any[] }) {
        const client = this.supabaseService.getClient();

        // 1. Fetch Goals with currency
        const { data: goals } = await client
            .from('goals')
            .select('title, target_amount, current_amount, target_currency, deadline')
            .eq('user_id', userId)
            .eq('status', 'active');

        // 2. Fetch recent transactions with category and currency (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: transactions } = await client
            .from('transactions')
            .select('amount, original_currency, date, description, category:categories(name)')
            .eq('user_id', userId)
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
            .order('date', { ascending: false });

        // 3. Fetch wallets
        const { data: wallets } = await client
            .from('wallets')
            .select('id, name, type, bank_name, currency, balance')
            .eq('user_id', userId);

        // 4. Fetch categories (system + user)
        const { data: categories } = await client
            .from('categories')
            .select('id, name')
            .or(`is_system.eq.true,user_id.eq.${userId}`);

        // Group spending by currency
        const spendingByCurrency: Record<string, number> = {};
        const incomeByCurrency: Record<string, number> = {};
        const categoryBreakdown: Record<string, number> = {};

        transactions?.forEach(t => {
            const amount = Number(t.amount);
            const currency = t.original_currency || 'NIO';
            const catName = (t.category as any)?.name || 'Sin categoría';

            if (amount < 0) {
                spendingByCurrency[currency] = (spendingByCurrency[currency] || 0) + Math.abs(amount);
                categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + Math.abs(amount);
            } else {
                incomeByCurrency[currency] = (incomeByCurrency[currency] || 0) + amount;
            }
        });

        const userDataContext = {
            note: 'NIO = Córdobas Nicaragüenses (C$), USD = Dólares Americanos ($). Always use the correct currency symbol when referring to amounts.',
            activeGoals: goals?.map(g => ({
                title: g.title,
                targetAmount: `${g.target_currency || 'NIO'} ${g.target_amount}`,
                currentAmount: `${g.target_currency || 'NIO'} ${g.current_amount}`,
                deadline: g.deadline
            })),
            last30Days: {
                spendingByCurrency,
                incomeByCurrency,
                categoryBreakdown,
                transactionsCount: transactions?.length || 0,
                recentTransactions: transactions?.slice(0, 5).map(t => ({
                    description: t.description,
                    amount: `${t.original_currency || 'NIO'} ${t.amount}`,
                    date: t.date,
                    category: (t.category as any)?.name || 'Sin categoría'
                }))
            },
            userWallets: wallets || [],
            userCategories: categories || [],
        };

        // Request structured reply from gemini
        let replyText = 'Lo siento, hubo un error procesando tu solicitud.';
        try {
            const rawReply = await this.geminiService.chatWithFinancialCoach(body.message, body.history, userDataContext);
            const trimmedReply = rawReply.trim();
            console.log('[InsightsService] AI Reply (trimmed):', trimmedReply.substring(0, 100));

            let aiResponse;
            if (trimmedReply.startsWith('{') || trimmedReply.startsWith('```')) {
                const clean = trimmedReply.replace(/^```(json)?\n?/i, '').replace(/```$/i, '').trim();
                try {
                    aiResponse = JSON.parse(clean);
                } catch (e) {
                    console.error('[InsightsService] Failed to parse JSON:', e);
                    aiResponse = { reply: rawReply };
                }
            } else {
                console.log('[InsightsService] Reply is not JSON');
                aiResponse = { reply: rawReply };
            }

            replyText = aiResponse.reply || rawReply;

            // Handle transaction creation intent
            if (aiResponse.action?.type === 'CREATE_TRANSACTION') {
                const { amount, description, wallet_id, category_id, type } = aiResponse.action.data;
                console.log('[InsightsService] CREATE_TRANSACTION params:', aiResponse.action.data);

                if (wallet_id && category_id && amount) {
                    const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
                    const wallet = wallets?.find(w => w.id === wallet_id);
                    if (wallet) {
                        const { error: insertError } = await client.from('transactions').insert({
                            user_id: userId,
                            wallet_id,
                            category_id,
                            amount: finalAmount,
                            original_currency: wallet.currency,
                            exchange_rate: 1, // Assume 1 for now or handle cross-currency in future
                            date: new Date().toISOString().split('T')[0],
                            description,
                        });

                        if (insertError) {
                            console.error('[InsightsService] DB Insert Error:', insertError);
                        } else {
                            // Update wallet balance
                            const newBalance = Number(wallet.balance) + finalAmount;
                            await client.from('wallets').update({ balance: newBalance }).eq('id', wallet_id);
                            replyText = replyText + '\n\n✅ ¡Transacción registrada exitosamente!';
                        }
                    } else {
                        console.error('[InsightsService] Wallet not found:', wallet_id);
                    }
                } else {
                    console.error('[InsightsService] Missing required fields. wallet_id:', wallet_id, 'category_id', category_id, 'amount', amount);
                }
            }
        } catch (error) {
            console.error('[InsightsService] Error handling chat message:', error);
        }

        return { reply: replyText };
    }
}
