import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    async create(userId: string, dto: CreateReminderDto) {
        const client = this.supabaseService.getClient();
        
        const payload = {
            user_id: userId,
            title: dto.title,
            description: dto.description || '',
            due_date: dto.due_date,
            amount_nio: dto.amount_nio,
            amount_usd: dto.amount_usd,
            is_paid: dto.is_paid || false,
        };

        const { data, error } = await client
            .from('reminders')
            .insert(payload)
            .select()
            .single();

        if (error) {
            this.logger.error(`Error creating reminder: ${error.message}`);
            if (error.code === '42P01') {
                throw new HttpException('La tabla "reminders" no existe en Supabase. Por favor usa el script para crearla.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            throw new HttpException(`Error al crear recordatorio: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return data;
    }

    async findAll(userId: string) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('reminders')
            .select('*')
            .eq('user_id', userId)
            .order('due_date', { ascending: true });

        if (error) {
            this.logger.error(`Error fetching reminders: ${error.message}`);
            if (error.code === '42P01') {
                return []; // Gracefully handle missing table
            }
            throw new HttpException('Error fetching reminders', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return data;
    }
}
