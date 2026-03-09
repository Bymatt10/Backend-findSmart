import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateReminderDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    due_date: string;

    @IsNumber()
    amount_nio: number;

    @IsNumber()
    amount_usd: number;

    @IsOptional()
    @IsBoolean()
    is_paid?: boolean;
}
