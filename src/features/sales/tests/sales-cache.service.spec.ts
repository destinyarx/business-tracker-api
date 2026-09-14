import { SalesCacheService } from '../sales-cache.service';

describe('SalesCacheService', () => {
	const cacheManager = {
		get: jest.fn(),
		set: jest.fn(),
	};
	const service = new SalesCacheService(cacheManager as never);

	beforeEach(() => jest.clearAllMocks());

	it('isolates normalized list keys by operator and parameters', () => {
		expect(service.listKey('user_1', 'v1', 'today', 'active', 'desc')).toBe(
			'sales:user_1:v1:today:active:desc',
		);
	});

	it('uses generation zero before the first rotation', async () => {
		cacheManager.get.mockResolvedValueOnce(undefined);
		await expect(service.generation('user_1')).resolves.toBe('0');
	});

	it('rotates only the requested operator generation', async () => {
		await service.rotate('user_1');
		expect(cacheManager.set).toHaveBeenCalledWith(
			'sales:user_1:generation',
			expect.any(String),
		);
	});
});
