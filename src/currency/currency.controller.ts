import { Controller, Get, Post, Body } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/convert.dto';

@Controller('currency')
export class CurrencyController {
    constructor(private readonly currencyService: CurrencyService) { }

    @Get('rate')
    async getRate() {
        const rate = await this.currencyService.getTodayRate();
        return { rate };
    }

    @Post('convert')
    async convert(@Body() dto: ConvertCurrencyDto) {
        return this.currencyService.convert(dto.amount, dto.from, dto.to);
    }
}
