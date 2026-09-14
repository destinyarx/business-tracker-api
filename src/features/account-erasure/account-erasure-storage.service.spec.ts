import { AccountErasureStorageService } from './account-erasure-storage.service';

describe('AccountErasureStorageService', () => {
	const config = {
		getOrThrow: jest.fn().mockReturnValue('configured-bucket'),
	};

	it('deletes nested objects without touching a similar user prefix', async () => {
		const remaining = new Map([
			['user_1', [{ id: null, name: 'nested' }]],
			['user_1/nested', [{ id: 'file-id', name: 'image.png' }]],
		]);
		const list = jest.fn((prefix: string) =>
			Promise.resolve({
				data: remaining.get(prefix) ?? [],
				error: null,
			}),
		);
		const remove = jest.fn((paths: string[]) => {
			remaining.set('user_1/nested', []);
			remaining.set('user_1', []);
			return Promise.resolve({ data: paths, error: null });
		});
		const from = jest.fn().mockReturnValue({ list, remove });
		const service = new AccountErasureStorageService(
			{ storage: { from } } as never,
			config as never,
		);

		await expect(service.erasePrefix('user_1')).resolves.toBe(1);
		expect(remove).toHaveBeenCalledWith(['user_1/nested/image.png']);
		expect(remove).not.toHaveBeenCalledWith(
			expect.arrayContaining([expect.stringContaining('user_10/')]),
		);
		expect(from).toHaveBeenCalledWith('configured-bucket');
	});

	it('deletes at most 1,000 objects per request and relists offset zero', async () => {
		let files = Array.from({ length: 1_001 }, (_, index) => ({
			id: `id-${index}`,
			name: `file-${index}.png`,
		}));
		const list = jest.fn((prefix: string, options: { offset: number }) => {
			void prefix;
			void options;
			return Promise.resolve({
				data: files.slice(0, 1_000),
				error: null,
			});
		});
		const remove = jest.fn((paths: string[]) => {
			const removed = new Set(
				paths.map((path) => path.split('/').at(-1)),
			);
			files = files.filter((file) => !removed.has(file.name));
			return Promise.resolve({ data: paths, error: null });
		});
		const service = new AccountErasureStorageService(
			{ storage: { from: () => ({ list, remove }) } } as never,
			config as never,
		);

		await expect(service.erasePrefix('user_1')).resolves.toBe(1_001);
		expect(remove.mock.calls.map(([paths]) => paths.length)).toEqual([
			1_000, 1,
		]);
		expect(
			list.mock.calls.every(([, options]) => options.offset === 0),
		).toBe(true);
	});
});
