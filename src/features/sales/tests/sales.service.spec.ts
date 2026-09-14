import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
	getSaleById,
	getSales,
} from '../../../infrastructure/database/queries/sales.queries';
import { SalesCacheService } from '../sales-cache.service';
import { SalesService } from '../sales.service';

jest.mock('../../../infrastructure/database/queries/sales.queries');

const mockedGetSales = jest.mocked(getSales);
const mockedGetSaleById = jest.mocked(getSaleById);

describe('SalesService', () => {
	let service: SalesService;
	const cacheManager = { get: jest.fn(), set: jest.fn() };
	const salesCache = {
		generation: jest.fn().mockResolvedValue('v1'),
		listKey: jest.fn().mockReturnValue('list-key'),
		detailKey: jest.fn().mockReturnValue('detail-key'),
	};
	const records = [
		{
			id: 1,
			orderName: 'Website order',
			customerName: 'Maria Santos',
			notes: 'Deliver tomorrow',
		},
		{
			id: 2,
			orderName: 'Walk-in',
			customerName: null,
			notes: null,
		},
	] as never;

	beforeEach(async () => {
		jest.clearAllMocks();
		salesCache.generation.mockResolvedValue('v1');
		salesCache.listKey.mockReturnValue('list-key');
		salesCache.detailKey.mockReturnValue('detail-key');

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SalesService,
				{ provide: CACHE_MANAGER, useValue: cacheManager },
				{ provide: SalesCacheService, useValue: salesCache },
			],
		}).compile();
		service = module.get(SalesService);
	});

	it('uses today, active, and descending defaults', async () => {
		cacheManager.get.mockResolvedValueOnce(undefined);
		mockedGetSales.mockResolvedValueOnce(records);

		await service.findAll('user_1', {});

		expect(salesCache.listKey).toHaveBeenCalledWith(
			'user_1',
			'v1',
			'today',
			'active',
			'desc',
		);
		expect(mockedGetSales).toHaveBeenCalledWith(
			'user_1',
			expect.any(Object),
			'active',
			'desc',
		);
		expect(cacheManager.set).toHaveBeenCalledWith('list-key', records);
	});

	it('searches only order name, customer name, and sale notes', async () => {
		cacheManager.get.mockResolvedValueOnce(records);

		await expect(
			service.findAll('user_1', { search: 'maria' }),
		).resolves.toEqual([records[0]]);
	});

	it('passes the authenticated owner to detail lookup', async () => {
		cacheManager.get.mockResolvedValueOnce(undefined);
		mockedGetSaleById.mockResolvedValueOnce(records[0]);

		await service.findOne(1, 'user_1');
		expect(mockedGetSaleById).toHaveBeenCalledWith(1, 'user_1');
	});

	it('returns 404 for a missing owned sale', async () => {
		cacheManager.get.mockResolvedValueOnce(undefined);
		mockedGetSaleById.mockResolvedValueOnce(undefined);

		await expect(service.findOne(9, 'user_1')).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});
});
