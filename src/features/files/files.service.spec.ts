import { FilesService } from './files.service';

describe('FilesService storage bucket', () => {
	it('uses the configured bucket for individual deletion', async () => {
		const remove = jest.fn().mockResolvedValue({ error: null });
		const from = jest.fn().mockReturnValue({ remove });
		const service = new FilesService(
			{ storage: { from } } as never,
			{
				getOrThrow: jest.fn().mockReturnValue('configured-bucket'),
			} as never,
		);

		await expect(
			service.deleteProductImage('user_1', 'image.png'),
		).resolves.toBe(true);
		expect(from).toHaveBeenCalledWith('configured-bucket');
		expect(remove).toHaveBeenCalledWith(['user_1/image.png']);
	});
});
