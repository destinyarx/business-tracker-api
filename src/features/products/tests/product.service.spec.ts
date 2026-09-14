import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../product.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SalesCacheService } from '../../sales/sales-cache.service';
import { NotFoundException } from '@nestjs/common';
import { updateProductStock } from '../../../infrastructure/database/queries/products.queries';

jest.mock('../../../infrastructure/database/queries/products.queries');

const mockedUpdateProductStock = jest.mocked(updateProductStock);

describe('ProductService', () => {
	let service: ProductService;
	const cacheManager = { del: jest.fn() };

	beforeEach(async () => {
		jest.clearAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProductService,
				{ provide: CACHE_MANAGER, useValue: cacheManager },
				{ provide: SalesCacheService, useValue: { rotate: jest.fn() } },
			],
		}).compile();

		service = module.get<ProductService>(ProductService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('updates owned product stock and invalidates the product cache', async () => {
		mockedUpdateProductStock.mockResolvedValueOnce({ id: 7, stock: 14 });

		await expect(
			service.updateStock(7, { stock: 14 }, 'user_1'),
		).resolves.toEqual({ id: 7, stock: 14 });
		expect(mockedUpdateProductStock).toHaveBeenCalledWith(7, 14, 'user_1');
		expect(cacheManager.del).toHaveBeenCalledWith('user_1:/products');
	});

	it('returns not found when the owned product does not exist', async () => {
		mockedUpdateProductStock.mockResolvedValueOnce(undefined);

		await expect(
			service.updateStock(99, { stock: 4 }, 'user_1'),
		).rejects.toBeInstanceOf(NotFoundException);
		expect(cacheManager.del).not.toHaveBeenCalled();
	});
});
