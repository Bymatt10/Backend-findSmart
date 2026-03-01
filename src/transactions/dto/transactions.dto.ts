import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsDateString, IsEnum } from 'class-validator';

export class CreateTransactionDto {
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    merchant_name?: string;

    @IsUUID()
    @IsOptional()
    category_id?: string;

    @IsEnum(['NIO', 'USD'])
    @IsOptional()
    original_currency?: 'NIO' | 'USD' = 'NIO';

    @IsEnum(['manual', 'excel', 'pdf', 'photo'])
    @IsOptional()
    source?: 'manual' | 'excel' | 'pdf' | 'photo' = 'manual';
}

export class UpdateTransactionDto {
    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    merchant_name?: string;

    @IsUUID()
    @IsOptional()
    category_id?: string;

    @IsEnum(['NIO', 'USD'])
    @IsOptional()
    original_currency?: 'NIO' | 'USD';
}
