import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Processor('file-processing')
export class FileProcessingWorker extends WorkerHost {
    private readonly logger = new Logger(FileProcessingWorker.name);

    constructor(private readonly supabaseService: SupabaseService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing job ${job.id} for file ${job.data.fileId}`);

        const { fileId, userId, storagePath, type } = job.data;
        const client = this.supabaseService.getClient();

        try {
            // 1. Update status to processing
            await client.from('file_uploads').update({ status: 'processing' }).eq('id', fileId);

            // 2. Download file from Storage
            const { data: fileData, error: downloadError } = await client.storage
                .from('user-uploads')
                .download(storagePath);

            if (downloadError) throw new Error(`Download failed: ${downloadError.message}`);

            const buffer = Buffer.from(await fileData.arrayBuffer());

            // 3. Process based on type (Mock processing for now, will implement exact parsers shortly)
            let transactions = [];
            if (type === 'excel') {
                // Excel parsing logic goes here...
            } else if (type === 'pdf') {
                // PDF parsing logic goes here...
            } else if (type === 'photo') {
                // Gemini API logic goes here...
            }

            // 4. Update status to completed
            await client.from('file_uploads').update({
                status: 'completed',
                transaction_count: transactions.length
            }).eq('id', fileId);

            this.logger.log(`Successfully completed job ${job.id}`);
            return { success: true };

        } catch (error) {
            this.logger.error(`Failed job ${job.id}`, error.stack);

            // Update status to failed
            await client.from('file_uploads').update({
                status: 'failed',
                error_message: error.message
            }).eq('id', fileId);

            throw error;
        }
    }
}
