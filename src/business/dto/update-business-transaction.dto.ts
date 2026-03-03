import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessTransactionDto } from './create-business-transaction.dto';
import { IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class UpdateBusinessTransactionDto extends PartialType(CreateBusinessTransactionDto) {
    @IsNumber()
    @IsOptional()
    sell_price?: number;

    @IsEnum(['bought', 'sold'])
    @IsOptional()
    status?: 'bought' | 'sold';

    @IsDateString()
    @IsOptional()
    sell_date?: string;
}
