import { Test, type TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
	let controller: DashboardController;
	const dashboardService = { getOverview: jest.fn() };

	beforeEach(async () => {
		jest.clearAllMocks();
		const module: TestingModule = await Test.createTestingModule({
			controllers: [DashboardController],
			providers: [
				{ provide: DashboardService, useValue: dashboardService },
			],
		}).compile();
		controller = module.get(DashboardController);
	});

	it('passes the authenticated operator and query to the service', async () => {
		const result = { asOf: '2026-09-12T00:00:00.000Z' };
		dashboardService.getOverview.mockResolvedValueOnce(result);

		await expect(
			controller.getOverview('user_1', { range: 'this_week' }),
		).resolves.toBe(result);
		expect(dashboardService.getOverview).toHaveBeenCalledWith('user_1', {
			range: 'this_week',
		});
	});
});
