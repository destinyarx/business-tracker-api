import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('ProductService', () => {
	let service: ProductService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProductService,
				{ provide: CACHE_MANAGER, useValue: { del: jest.fn() } },
			],
		}).compile();

		service = module.get<ProductService>(ProductService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
