import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsDateString, IsEnum } from 'class-validator';

export class CreateBusinessTransactionDto {
    @IsString()
    @IsNotEmpty()
    product_name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsNotEmpty()
    buy_cost: number;

    @IsNumber()
    @IsOptional()
    extra_costs?: number = 0;

    @IsString()
    @IsOptional()
    extra_costs_detail?: string;

    @IsNumber()
    @IsOptional()
    sell_price?: number;

    @IsEnum(['NIO', 'USD'])
    @IsOptional()
    currency?: 'NIO' | 'USD' = 'NIO';

    @IsDateString()
    @IsOptional()
    buy_date?: string;

    @IsDateString()
    @IsOptional()
    sell_date?: string;

    @IsUUID()
    @IsOptional()
    goal_id?: string;

    @IsEnum(['bought', 'sold'])
    @IsOptional()
    status?: 'bought' | 'sold' = 'bought';
}
