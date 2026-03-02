import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private readonly logger = new Logger(SupabaseService.name);
    private supabase: SupabaseClient;

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('supabase.url');
        // For backend ops we use service role key to bypass RLS on admin tasks, 
        // but auth tasks require anon key check or passing JWT logic.
        const supabaseKey = this.configService.get<string>('supabase.serviceRoleKey');

        if (!supabaseUrl || !supabaseKey) {
            this.logger.warn('Supabase URL or Key is missing. Check your environment variables.');
        } else {
            this.supabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });
            this.logger.log('Supabase Client initialized with Service Role Key');
        }
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }
}
