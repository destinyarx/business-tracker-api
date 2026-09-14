import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SalesCacheService } from '../../sales/sales-cache.service';
import { updateOrderStatus } from '../../../infrastructure/database/queries/orders.queries';
import { BadRequestException, ConflictException } from '@nestjs/common';

jest.mock('../../../infrastructure/database/queries/orders.queries');

const mockedUpdateOrderStatus = jest.mocked(updateOrderStatus);

describe('OrdersService', () => {
	let service: OrdersService;
	const cacheManager = { del: jest.fn() };
	const salesCache = { rotate: jest.fn() };

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OrdersService,
				{ provide: CACHE_MANAGER, useValue: cacheManager },
				{ provide: SalesCacheService, useValue: salesCache },
			],
		}).compile();

		service = module.get<OrdersService>(OrdersService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('requires a reversal reason when leaving completed', async () => {
		mockedUpdateOrderStatus.mockResolvedValueOnce({
			kind: 'missing_reversal_reason',
		});

		await expect(
			service.updateOrderStatus(1, { status: 'in_progress' }, 'user_1'),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it('returns conflict for insufficient stock', async () => {
		mockedUpdateOrderStatus.mockResolvedValueOnce({
			kind: 'insufficient_stock',
		});

		await expect(
			service.updateOrderStatus(1, { status: 'in_progress' }, 'user_1'),
		).rejects.toBeInstanceOf(ConflictException);
	});

	it('invalidates order, product, and sales caches after a change', async () => {
		mockedUpdateOrderStatus.mockResolvedValueOnce({
			kind: 'updated',
			id: 1,
		});

		await expect(
			service.updateOrderStatus(1, { status: 'completed' }, 'user_1'),
		).resolves.toEqual({ id: 1, changed: true });
		expect(cacheManager.del).toHaveBeenCalledWith('user_1:/orders');
		expect(cacheManager.del).toHaveBeenCalledWith('user_1:/products');
		expect(salesCache.rotate).toHaveBeenCalledWith('user_1');
	});
});
