import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { StatementParserService } from './statement-parser.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('upload')
export class UploadController {
    constructor(
        private readonly uploadService: UploadService,
        private readonly statementParserService: StatementParserService,
    ) { }

    @Post('parse-statement')
    @UseInterceptors(FileInterceptor('file'))
    async parseStatement(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No se subió ningún archivo');
        if (file.mimetype !== 'application/pdf') {
            throw new BadRequestException('Solo se aceptan archivos PDF');
        }
        return this.statementParserService.parseStatement(file.buffer, file.originalname);
    }

    @Post('excel')
    @UseGuards(SupabaseAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadExcel(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.uploadService.processUpload(file, user.id, 'excel');
    }

    @Post('pdf')
    @UseGuards(SupabaseAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadPdf(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.uploadService.processUpload(file, user.id, 'pdf');
    }

    @Post('photo')
    @UseGuards(SupabaseAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadPhoto(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.uploadService.processUpload(file, user.id, 'photo');
    }
}
