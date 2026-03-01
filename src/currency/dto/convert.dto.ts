import { IsNumber, IsEnum, IsNotEmpty } from 'class-validator';

export class ConvertCurrencyDto {
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsEnum(['NIO', 'USD'])
    @IsNotEmpty()
    from: 'NIO' | 'USD';

    @IsEnum(['NIO', 'USD'])
    @IsNotEmpty()
    to: 'NIO' | 'USD';
}
