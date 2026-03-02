import { IsString, IsNumber, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateGoalDto {
    @IsString()
    title: string;

    @IsNumber()
    target_amount: number;

    @IsDateString()
    @IsOptional()
    deadline?: string;

    @IsString()
    @IsOptional()
    @IsIn(['NIO', 'USD'])
    target_currency?: string;
}

export class UpdateProgressDto {
    @IsNumber()
    amount_to_add: number;
}
