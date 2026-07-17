import { BadRequestException, Controller, Post, Req, Delete, Param } from '@nestjs/common';
import { FilesService } from './files.service';
import { UserId } from '../common/decorators/user-id.decorator'
import type { FastifyRequest } from 'fastify';

type UploadRequest = FastifyRequest<{ Body: unknown }>;

@Controller('files')
export class FilesController {
    constructor(private readonly fileService: FilesService) {}

    @Post('upload/product-image')
    async uploadProductImage(@UserId() userId: string, @Req() req: UploadRequest) {
        const buffer = req.isMultipart()
            ? await this.getMultipartBuffer(req)
            : await this.getRawBuffer(req.body);
        const contentType = String(req.headers['content-type'] || '');
        const filename = String(req.headers['x-filename'] || 'upload.bin');

        return this.fileService.uploadProductImage(userId, buffer, filename, contentType);
    }

    private async getMultipartBuffer(req: FastifyRequest): Promise<Buffer> {
        const file = await req.file();

        if (!file) return Buffer.alloc(0);

        if (file.fieldname !== 'image') {
            file.file.resume();
            throw new BadRequestException('Unexpected field');
        }

        return file.toBuffer();
    }

    private async getRawBuffer(body: unknown): Promise<Buffer> {
        if (Buffer.isBuffer(body)) return body;
        if (typeof body === 'string') return Buffer.from(body);
        if (!this.isAsyncIterable(body)) return Buffer.alloc(0);

        const chunks: Buffer[] = [];

        for await (const chunk of body) {
            if (Buffer.isBuffer(chunk)) {
                chunks.push(chunk);
            } else if (chunk instanceof Uint8Array || typeof chunk === 'string') {
                chunks.push(Buffer.from(chunk));
            }
        }

        return Buffer.concat(chunks);
    }

    private isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
        return (
            typeof value === 'object' &&
            value !== null &&
            Symbol.asyncIterator in value
        );
    }

    @Delete('delete/product-image/:filename')
    async deleteProductImage(@UserId() userId: string, @Param('filename') filename: string) {
        return this.fileService.deleteProductImage(userId, filename)
    }
}
