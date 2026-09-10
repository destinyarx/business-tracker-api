import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('CustomerController', () => {
	let controller: CustomerController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [CustomerController],
			providers: [
				CustomerService,
				{ provide: CACHE_MANAGER, useValue: { del: jest.fn() } },
			],
		}).compile();

		controller = module.get<CustomerController>(CustomerController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
