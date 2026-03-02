import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GeminiService } from '../gemini/gemini.service';
import { KEYWORD_RULES } from './keyword-rules';
import * as crypto from 'crypto';

@Injectable()
export class ClassificationService {
    private readonly logger = new Logger(ClassificationService.name);

    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly geminiService: GeminiService,
    ) { }

    private generateHash(merchantName: string): string {
        // Normalize string: lowercase, remove special chars, trim
        const normalized = merchantName.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    async categorizeTransaction(merchantName: string, amount: number, availableCategories: { id: string, name: string }[]): Promise<string> {
        const rawName = merchantName.toLowerCase();

        // 1. Check Keywords (Deterministic - Free & Instant)
        for (const [key, categoryName] of Object.entries(KEYWORD_RULES)) {
            if (rawName.includes(key)) {
                this.logger.log(`Keyword match for ${merchantName} -> ${categoryName}`);
                const found = availableCategories.find(c => c.name === categoryName);
                if (found) return found.id;
                return '';
            }
        }

        const merchantHash = this.generateHash(merchantName);
        const client = this.supabaseService.getClient();

        // 2. Check Semantic Cache (Database - Super Fast)
        const { data: cached } = await client
            .from('merchant_cache')
            .select('category_id')
            .eq('merchant_hash', merchantHash)
            .single();

        if (cached && cached.category_id) {
            this.logger.log(`Cache hit for ${merchantName}`);
            return cached.category_id;
        }

        // 3. Fallback to Gemini AI (Slower, requires API call)
        this.logger.log(`Cache miss for ${merchantName}. Calling Gemini...`);
        const categoryNames = availableCategories.map(c => c.name);
        const predictedName = await this.geminiService.classifyTransaction(merchantName, amount, categoryNames);

        const matchedCategory = availableCategories.find(c => c.name === predictedName);
        const resolvedCategoryId = matchedCategory ? matchedCategory.id : (availableCategories.find(c => c.name === 'Otros')?.id || '');

        if (resolvedCategoryId) {
            // Save to Cache for next time
            await client.from('merchant_cache').insert({
                merchant_hash: merchantHash,
                merchant_name: merchantName,
                category_id: resolvedCategoryId
            });
        }

        return resolvedCategoryId;
    }
}
