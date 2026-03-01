import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    icon?: string;
}

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    @MaxLength(50)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    icon?: string;
}
