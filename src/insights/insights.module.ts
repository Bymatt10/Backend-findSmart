import { Module } from '@nestjs/common';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
    imports: [GeminiModule],
    controllers: [InsightsController],
    providers: [InsightsService],
    exports: [InsightsService],
})
export class InsightsModule { }
