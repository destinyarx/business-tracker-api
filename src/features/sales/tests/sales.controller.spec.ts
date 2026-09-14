import { Test, type TestingModule } from '@nestjs/testing';
import { SalesController } from '../sales.controller';
import { SalesService } from '../sales.service';

describe('SalesController', () => {
	let controller: SalesController;
	const salesService = {
		findAll: jest.fn(),
		findOne: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [SalesController],
			providers: [{ provide: SalesService, useValue: salesService }],
		}).compile();
		controller = module.get(SalesController);
	});

	it('delegates list queries with the authenticated operator', async () => {
		salesService.findAll.mockResolvedValueOnce([]);
		await controller.findAll('user_1', { range: 'today' });
		expect(salesService.findAll).toHaveBeenCalledWith('user_1', {
			range: 'today',
		});
	});

	it('delegates detail queries with the authenticated operator', async () => {
		salesService.findOne.mockResolvedValueOnce({ id: 1 });
		await controller.findOne('user_1', 1);
		expect(salesService.findOne).toHaveBeenCalledWith(1, 'user_1');
	});
});
