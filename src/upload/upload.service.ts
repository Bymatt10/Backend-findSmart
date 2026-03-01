import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    constructor(
        @InjectQueue('file-processing') private fileQueue: Queue,
        private readonly supabaseService: SupabaseService,
    ) { }

    async processUpload(file: Express.Multer.File, userId: string, type: 'excel' | 'pdf' | 'photo') {
        const client = this.supabaseService.getClient();
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await client
            .storage
            .from('user-uploads')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
            });

        if (storageError) {
            throw new InternalServerErrorException('Failed to upload file to storage');
        }

        // Insert into file_uploads table
        const { data: fileRecord, error: dbError } = await client
            .from('file_uploads')
            .insert({
                user_id: userId,
                file_name: file.originalname,
                file_type: type,
                storage_path: fileName,
                status: 'pending'
            })
            .select()
            .single();

        if (dbError) {
            throw new InternalServerErrorException('Failed to create file record');
        }

        // Add job to Queue
        await this.fileQueue.add('process-file', {
            fileId: fileRecord.id,
            userId,
            storagePath: fileName,
            type
        });

        return fileRecord;
    }
}
