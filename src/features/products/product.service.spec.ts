import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SalesCacheService } from '../sales/sales-cache.service';

describe('ProductService', () => {
	let service: ProductService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProductService,
				{ provide: CACHE_MANAGER, useValue: { del: jest.fn() } },
				{ provide: SalesCacheService, useValue: { rotate: jest.fn() } },
			],
		}).compile();

		service = module.get<ProductService>(ProductService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
