import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CreateWalletDto {
    @IsString()
    name: string;

    @IsString()
    @IsIn(['debit', 'savings', 'credit_card', 'cash'])
    type: string;

    @IsOptional()
    @IsNumber()
    balance?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    bank_name?: string;

    @IsOptional()
    @IsString()
    account_number?: string;

    @IsOptional()
    @IsNumber()
    credit_limit?: number;
}

export class UpdateWalletDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    @IsIn(['debit', 'savings', 'credit_card', 'cash'])
    type?: string;

    @IsOptional()
    @IsNumber()
    balance?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    bank_name?: string;

    @IsOptional()
    @IsString()
    account_number?: string;

    @IsOptional()
    @IsNumber()
    credit_limit?: number;
}
