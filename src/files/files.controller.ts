import { Controller, Post, UseInterceptors, Req, Delete, Param } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserId } from '../common/decorators/user-id.decorator'
import type { Request } from 'express';

@Controller('files')
export class FilesController {
    constructor(private readonly fileService: FilesService) {}

    @Post('upload/product-image')
    @UseInterceptors(FileInterceptor('image'))
    async uploadProductImage(@UserId() userId: string, @Req() req: Request) {
        const chunks: Buffer[] = [];

        for await (const chunk of req) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks); 
        const contentType = String(req.headers['content-type'] || '');
        const filename = String(req.headers['x-filename'] || 'upload.bin');

        return this.fileService.uploadProductImage(userId, buffer, filename, contentType);
    }

    @Delete('delete/product-image/:filename')
    async deleteProductImage(@UserId() userId: string, @Param('filename') filename: string) {
        return this.fileService.deleteProductImage(userId, filename)
    }
}
