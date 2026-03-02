import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('upload')
@UseGuards(SupabaseAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('excel')
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcel(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.uploadService.processUpload(file, user.id, 'excel');
    }

    @Post('pdf')
    @UseInterceptors(FileInterceptor('file'))
    async uploadPdf(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.uploadService.processUpload(file, user.id, 'pdf');
    }

    @Post('photo')
    @UseInterceptors(FileInterceptor('file'))
    async uploadPhoto(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.uploadService.processUpload(file, user.id, 'photo');
    }
}
