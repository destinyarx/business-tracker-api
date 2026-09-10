import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('ProductController', () => {
	let controller: ProductController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProductController],
			providers: [
				ProductService,
				{ provide: CACHE_MANAGER, useValue: { del: jest.fn() } },
			],
		}).compile();

		controller = module.get<ProductController>(ProductController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
