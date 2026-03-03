import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessTransactionDto } from './dto/create-business-transaction.dto';
import { UpdateBusinessTransactionDto } from './dto/update-business-transaction.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('business')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('business')
export class BusinessController {
    constructor(private readonly businessService: BusinessService) { }

    @Post()
    @ApiOperation({ summary: 'Creates a new business transaction (buy/sell product)' })
    create(@Request() req: any, @Body() createDto: CreateBusinessTransactionDto) {
        return this.businessService.create(req.user.id, createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all business transactions matching queries' })
    findAll(@Request() req: any, @Query('limit') limit?: number, @Query('offset') offset?: number) {
        return this.businessService.findAll(req.user.id, limit ? +limit : 50, offset ? +offset : 0);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get business statistics regarding sales, profit, invested' })
    getStats(@Request() req: any) {
        return this.businessService.getStats(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Find business transaction by ID' })
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.businessService.findOne(req.user.id, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update business transaction (e.g., mark as sold, add sell price)' })
    update(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateBusinessTransactionDto) {
        return this.businessService.update(req.user.id, id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete business transaction' })
    remove(@Request() req: any, @Param('id') id: string) {
        return this.businessService.remove(req.user.id, id);
    }
}
