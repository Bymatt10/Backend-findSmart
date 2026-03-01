import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { FileProcessingWorker } from './workers/file-processing.worker';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'file-processing',
        }),
    ],
    controllers: [UploadController],
    providers: [UploadService, FileProcessingWorker],
})
export class UploadModule { }
