import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ClassificationModule } from '../classification/classification.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [SupabaseModule, ClassificationModule, CurrencyModule],
  providers: [TransactionsService],
  controllers: [TransactionsController]
})
export class TransactionsModule { }
