import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('CustomerService', () => {
	let service: CustomerService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CustomerService,
				{ provide: CACHE_MANAGER, useValue: { del: jest.fn() } },
			],
		}).compile();

		service = module.get<CustomerService>(CustomerService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
