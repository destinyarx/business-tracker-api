import type { FastifyRequest } from 'fastify';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
	it('forwards the uploaded file metadata instead of the multipart request metadata', async () => {
		const uploadProductImage = jest.fn().mockResolvedValue({});
		const controller = new FilesController({
			uploadProductImage,
		} as unknown as FilesService);
		const image = Buffer.from('image bytes');
		const request = {
			body: undefined,
			headers: {
				'content-type':
					'multipart/form-data; boundary=browser-generated-boundary',
			},
			isMultipart: () => true,
			file: jest.fn().mockResolvedValue({
				fieldname: 'image',
				filename: 'product.png',
				mimetype: 'image/png',
				file: { resume: jest.fn() },
				toBuffer: jest.fn().mockResolvedValue(image),
			}),
		} as unknown as FastifyRequest<{ Body: unknown }>;

		await controller.uploadProductImage('user_1', request);

		expect(uploadProductImage).toHaveBeenCalledWith(
			'user_1',
			image,
			'product.png',
			'image/png',
		);
	});
});
