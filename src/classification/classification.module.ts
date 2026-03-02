import { Module } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
    imports: [SupabaseModule, GeminiModule],
    providers: [ClassificationService],
    exports: [ClassificationService]
})
export class ClassificationModule { }
