import { UnauthorizedException } from '@nestjs/common';
import {
	getDashboardCashflowExpenses,
	getDashboardCashflowSales,
	getDashboardCustomerCadence,
	getDashboardExpenseBreakdown,
	getDashboardExpenseHistory,
	getDashboardExpenseSummary,
	getDashboardOrderSnapshot,
	getDashboardSalesSummary,
	getDashboardStockSnapshot,
	getDashboardTopCustomers,
	getDashboardTopProducts,
} from '../../../infrastructure/database/queries/dashboard.queries';
import { DashboardService } from '../dashboard.service';

jest.mock('../../../infrastructure/database/queries/dashboard.queries');

const mocks = {
	salesSummary: jest.mocked(getDashboardSalesSummary),
	dailySales: jest.mocked(getDashboardCashflowSales),
	expenseSummary: jest.mocked(getDashboardExpenseSummary),
	dailyExpenses: jest.mocked(getDashboardCashflowExpenses),
	expenseBreakdown: jest.mocked(getDashboardExpenseBreakdown),
	orderSnapshot: jest.mocked(getDashboardOrderSnapshot),
	stockSnapshot: jest.mocked(getDashboardStockSnapshot),
	topProducts: jest.mocked(getDashboardTopProducts),
	topCustomers: jest.mocked(getDashboardTopCustomers),
	customerCadence: jest.mocked(getDashboardCustomerCadence),
	expenseHistory: jest.mocked(getDashboardExpenseHistory),
};

describe('DashboardService', () => {
	const service = new DashboardService();
	const now = new Date('2026-09-09T04:30:00.000Z');

	beforeEach(() => {
		jest.clearAllMocks();
		mocks.salesSummary.mockResolvedValue({
			completedOrderCount: 2,
			salesAmount: '300.00',
			estimatedProfitAmount: '80.00',
			inaccurateSaleCount: 1,
		});
		mocks.dailySales.mockResolvedValue([
			{ day: '2026-09-08', amount: '300.00' },
		]);
		mocks.expenseSummary.mockResolvedValue({
			expenseRecordCount: 2,
			expenseAmount: '100.00',
		});
		mocks.dailyExpenses.mockResolvedValue([
			{ day: '2026-09-08', amount: '100.00' },
		]);
		mocks.expenseBreakdown.mockResolvedValue([
			{ category: 'utilities', amount: '25.00' },
			{ category: 'inventory', amount: '75.00' },
		]);
		mocks.orderSnapshot.mockResolvedValue({
			queuedOrderCount: 0,
			totalOrderCount: 4,
			queuedAmount: '0.00',
		});
		mocks.stockSnapshot.mockResolvedValue([]);
		mocks.topProducts.mockResolvedValue([
			{
				productId: 2,
				title: 'Second',
				revenueAmount: '100.00',
				quantitySold: 3,
			},
			{
				productId: 1,
				title: 'Leader',
				revenueAmount: '200.00',
				quantitySold: 2,
			},
		]);
		mocks.topCustomers.mockResolvedValue([
			{
				customerId: 1,
				name: 'Maria',
				completedOrderCount: 2,
				salesAmount: '180.00',
			},
		]);
		mocks.customerCadence.mockResolvedValue([]);
		mocks.expenseHistory.mockResolvedValue([]);
	});

	it('defaults to this month and builds the dashboard contract', async () => {
		const result = await service.getOverview('user_1', {}, now);

		expect(mocks.salesSummary).toHaveBeenCalledWith(
			'user_1',
			expect.objectContaining({ key: 'this_month' }),
		);
		expect(result.range).toMatchObject({
			key: 'this_month',
			label: 'This month',
			timeZone: 'Asia/Manila',
		});
		expect(result.metrics).toEqual({
			salesAmount: '300.00',
			expenseAmount: '100.00',
			estimatedProfitAmount: '80.00',
			inaccurateSaleCount: 1,
			completedOrderCount: 2,
			queuedOrderCount: 0,
			totalOrderCount: 4,
		});
		expect(result.expenseBreakdown.map((row) => row.category)).toEqual([
			'inventory',
			'utilities',
		]);
		expect(result.topProducts).toEqual([
			expect.objectContaining({
				rank: 1,
				title: 'Leader',
				percentageOfLeader: 100,
			}),
			expect.objectContaining({
				rank: 2,
				title: 'Second',
				percentageOfLeader: 50,
			}),
		]);
		expect(result.cashflow).toHaveLength(2);
		expect(result.cashflow[1]).toMatchObject({
			salesAmount: '300.00',
			expenseAmount: '100.00',
			netAmount: '200.00',
		});
	});

	it('returns guarded zero values and empty rankings', async () => {
		mocks.salesSummary.mockResolvedValueOnce({
			completedOrderCount: 0,
			salesAmount: '0',
			estimatedProfitAmount: '0',
			inaccurateSaleCount: 0,
		});
		mocks.expenseSummary.mockResolvedValueOnce({
			expenseRecordCount: 0,
			expenseAmount: '0',
		});

		const result = await service.getOverview(
			'user_1',
			{ range: 'this_week' },
			now,
		);

		expect(result.metrics.salesAmount).toBe('0.00');
		expect(result.metrics.expenseAmount).toBe('0.00');
		expect(result.expenseBreakdown).toEqual([]);
		expect(result.topCustomers).toEqual([]);
		expect(
			result.cashflow.every(
				(bucket) =>
					!Number.isNaN(Number(bucket.netAmount)) &&
					Number.isFinite(Number(bucket.netAmount)),
			),
		).toBe(true);
	});

	it('builds attention facts in priority order', async () => {
		mocks.stockSnapshot.mockResolvedValueOnce([
			{ productId: 1, title: 'Soap', stock: 0 },
			{ productId: 2, title: 'Coffee', stock: 4 },
		]);
		mocks.orderSnapshot.mockResolvedValueOnce({
			queuedOrderCount: 2,
			totalOrderCount: 4,
			queuedAmount: '140.00',
		});
		mocks.customerCadence.mockResolvedValueOnce([
			{
				customerId: 7,
				customerName: 'Nena',
				recognizedAt: new Date('2026-08-01T04:00:00.000Z'),
			},
			{
				customerId: 7,
				customerName: 'Nena',
				recognizedAt: new Date('2026-08-08T04:00:00.000Z'),
			},
			{
				customerId: 7,
				customerName: 'Nena',
				recognizedAt: new Date('2026-08-15T04:00:00.000Z'),
			},
		]);
		mocks.expenseHistory.mockResolvedValueOnce([
			{ month: '2026-06', category: 'utilities', amount: '100.00' },
			{ month: '2026-07', category: 'utilities', amount: '100.00' },
			{ month: '2026-08', category: 'utilities', amount: '100.00' },
			{ month: '2026-09', category: 'utilities', amount: '150.00' },
		]);

		const result = await service.getOverview('user_1', {}, now);

		expect(result.attention.map((fact) => fact.kind)).toEqual([
			'out_of_stock',
			'low_stock',
			'queued_orders',
			'lapsed_customer',
			'expense_anomaly',
		]);
		expect(result.attention[3].entityId).toBe(7);
	});

	it('omits cadence and anomaly facts without enough evidence', async () => {
		mocks.customerCadence.mockResolvedValueOnce([
			{
				customerId: 7,
				customerName: 'Nena',
				recognizedAt: new Date('2026-08-01T04:00:00.000Z'),
			},
		]);
		mocks.expenseHistory.mockResolvedValueOnce([
			{ month: '2026-08', category: 'rent', amount: '100.00' },
			{ month: '2026-09', category: 'rent', amount: '500.00' },
		]);

		const result = await service.getOverview('user_1', {}, now);

		expect(result.attention).toEqual([]);
	});

	it('rejects a missing authenticated operator', async () => {
		await expect(service.getOverview('', {}, now)).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
		expect(mocks.salesSummary).not.toHaveBeenCalled();
	});
});
