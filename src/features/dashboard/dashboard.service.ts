import { Injectable, UnauthorizedException } from '@nestjs/common';
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
	type DashboardCustomerSaleRow,
	type DashboardExpenseHistoryRow,
	type DashboardStockRow,
} from '../../infrastructure/database/queries/dashboard.queries';
import {
	DASHBOARD_TIME_ZONE,
	getDashboardDateRange,
	getDashboardExpenseHistoryStart,
	getManilaMonthKey,
	getPreviousManilaMonthKeys,
} from './dashboard-date-range';
import type {
	DashboardAttention,
	DashboardExpenseCategory,
	DashboardOverview,
} from './dashboard.types';
import type { GetDashboardDto } from './dto/get-dashboard.dto';

export const DASHBOARD_LOW_STOCK_THRESHOLD = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function toAmount(value: string | number | null | undefined): number {
	const amount = Number(value ?? 0);
	return Number.isFinite(amount) ? amount : 0;
}

function toMoney(value: string | number | null | undefined): string {
	return toAmount(value).toFixed(2);
}

function roundPercentage(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.round(value * 10) / 10;
}

function categoryLabel(category: string): string {
	return category
		.replaceAll('_', ' ')
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(' ');
}

function productName(row: DashboardStockRow): string {
	return row.title?.trim() || 'Untitled product';
}

function plural(count: number, singular: string, multiple = `${singular}s`) {
	return count === 1 ? singular : multiple;
}

function buildStockAttention(rows: DashboardStockRow[]): DashboardAttention[] {
	const attention: DashboardAttention[] = [];
	const outOfStock = rows.filter((row) => row.stock === 0);
	const lowStock = rows.filter(
		(row) =>
			row.stock > 0 && row.stock < DASHBOARD_LOW_STOCK_THRESHOLD,
	);

	if (outOfStock.length > 0) {
		const names = outOfStock.slice(0, 3).map(productName).join(', ');
		attention.push({
			kind: 'out_of_stock',
			severity: 'critical',
			title: `${outOfStock.length} ${plural(outOfStock.length, 'product')} out of stock`,
			detail: `Inventory · ${outOfStock.length} ${plural(outOfStock.length, 'product')}: ${names}`,
			targetModule: 'inventory',
			entityId:
				outOfStock.length === 1 ? outOfStock[0].productId : null,
		});
	}

	if (lowStock.length > 0) {
		const names = lowStock
			.slice(0, 3)
			.map((row) => `${productName(row)} (${row.stock} left)`)
			.join(', ');
		attention.push({
			kind: 'low_stock',
			severity: 'warning',
			title: `${lowStock.length} ${plural(lowStock.length, 'product')} below the reorder point`,
			detail: `Inventory · ${names}`,
			targetModule: 'inventory',
			entityId: lowStock.length === 1 ? lowStock[0].productId : null,
		});
	}

	return attention;
}

function buildLapsedCustomerAttention(
	rows: DashboardCustomerSaleRow[],
	now: Date,
): DashboardAttention | undefined {
	const customers = new Map<
		number,
		{ name: string; dates: Date[] }
	>();
	for (const row of rows) {
		const customer = customers.get(row.customerId) ?? {
			name: row.customerName?.trim() || 'Unnamed customer',
			dates: [],
		};
		customer.name = row.customerName?.trim() || customer.name;
		customer.dates.push(row.recognizedAt);
		customers.set(row.customerId, customer);
	}

	const candidates = [...customers.entries()]
		.filter(([, customer]) => customer.dates.length >= 3)
		.map(([customerId, customer]) => {
			const dates = customer.dates.sort(
				(a, b) => a.getTime() - b.getTime(),
			);
			const gaps = dates.slice(1).map(
				(date, index) =>
					(date.getTime() - dates[index].getTime()) / DAY_MS,
			);
			const averageGap =
				gaps.reduce((total, gap) => total + gap, 0) / gaps.length;
			const daysSinceLatest =
				(now.getTime() - dates[dates.length - 1].getTime()) / DAY_MS;
			return {
				customerId,
				name: customer.name,
				averageGap,
				daysSinceLatest,
				overdueDays: daysSinceLatest - averageGap,
			};
		})
		.filter(
			(customer) =>
				customer.daysSinceLatest > customer.averageGap * 1.25 &&
				customer.overdueDays >= 2,
		)
		.sort(
			(a, b) =>
				b.overdueDays - a.overdueDays || a.customerId - b.customerId,
		);

	const lapsed = candidates[0];
	if (!lapsed) return undefined;

	return {
		kind: 'lapsed_customer',
		severity: 'insight',
		title: `${lapsed.name} has not ordered in ${Math.floor(lapsed.daysSinceLatest)} days`,
		detail: `Customers · usually orders every ${Math.max(1, Math.round(lapsed.averageGap))} days`,
		targetModule: 'customers',
		entityId: lapsed.customerId,
	};
}

function buildExpenseAnomalyAttention(
	rows: DashboardExpenseHistoryRow[],
	now: Date,
): DashboardAttention | undefined {
	const currentMonth = getManilaMonthKey(now);
	const previousMonths = getPreviousManilaMonthKeys(now);
	const categories = new Map<string, Map<string, number>>();

	for (const row of rows) {
		const months = categories.get(row.category) ?? new Map<string, number>();
		months.set(row.month, toAmount(row.amount));
		categories.set(row.category, months);
	}

	const anomalies = [...categories.entries()]
		.map(([category, months]) => {
			const previousAmounts = previousMonths.map(
				(month) => months.get(month) ?? 0,
			);
			const nonzeroMonths = previousAmounts.filter(
				(amount) => amount > 0,
			).length;
			const average =
				previousAmounts.reduce((total, amount) => total + amount, 0) /
				previousMonths.length;
			const current = months.get(currentMonth) ?? 0;
			const percentageIncrease =
				average > 0 ? ((current - average) / average) * 100 : 0;
			return {
				category,
				current,
				nonzeroMonths,
				percentageIncrease,
			};
		})
		.filter(
			(row) =>
				row.nonzeroMonths >= 2 && row.percentageIncrease >= 20,
		)
		.sort(
			(a, b) =>
				b.percentageIncrease - a.percentageIncrease ||
				a.category.localeCompare(b.category),
		);

	const anomaly = anomalies[0];
	if (!anomaly) return undefined;
	const label = categoryLabel(anomaly.category);

	return {
		kind: 'expense_anomaly',
		severity: 'warning',
		title: `${label} is ${Math.round(anomaly.percentageIncrease)}% above its three-month average`,
		detail: `Expenses · ₱${toMoney(anomaly.current)} this month`,
		targetModule: 'expenses',
		entityId: null,
	};
}

@Injectable()
export class DashboardService {
	async getOverview(
		userId: string,
		query: GetDashboardDto,
		now: Date = new Date(),
	): Promise<DashboardOverview> {
		if (!userId) throw new UnauthorizedException('Operator not found');

		const range = getDashboardDateRange(
			query.range ?? 'this_month',
			now,
		);
		const [
			salesSummary,
			dailySales,
			expenseSummary,
			dailyExpenses,
			expenseRows,
			orderSnapshot,
			stockRows,
			productRows,
			customerRows,
			customerCadence,
			expenseHistory,
		] = await Promise.all([
			getDashboardSalesSummary(userId, range),
			getDashboardCashflowSales(userId, range),
			getDashboardExpenseSummary(userId, range),
			getDashboardCashflowExpenses(userId, range),
			getDashboardExpenseBreakdown(userId, range),
			getDashboardOrderSnapshot(userId),
			getDashboardStockSnapshot(userId),
			getDashboardTopProducts(userId, range),
			getDashboardTopCustomers(userId, range),
			getDashboardCustomerCadence(userId),
			getDashboardExpenseHistory(
				userId,
				getDashboardExpenseHistoryStart(now),
				now,
			),
		]);

		const salesAmount = toAmount(salesSummary.salesAmount);
		const expenseAmount = toAmount(expenseSummary.expenseAmount);
		const dailySalesMap = new Map(
			dailySales.map((row) => [row.day, toAmount(row.amount)]),
		);
		const dailyExpensesMap = new Map(
			dailyExpenses.map((row) => [row.day, toAmount(row.amount)]),
		);

		const cashflow = range.buckets.map((bucket) => {
			const bucketSales = bucket.dayKeys.reduce(
				(total, day) => total + (dailySalesMap.get(day) ?? 0),
				0,
			);
			const bucketExpenses = bucket.dayKeys.reduce(
				(total, day) => total + (dailyExpensesMap.get(day) ?? 0),
				0,
			);
			return {
				key: bucket.key,
				label: bucket.label,
				start: bucket.start.toISOString(),
				end: bucket.end.toISOString(),
				salesAmount: toMoney(bucketSales),
				expenseAmount: toMoney(bucketExpenses),
				netAmount: toMoney(bucketSales - bucketExpenses),
			};
		});

		const expenseBreakdown: DashboardExpenseCategory[] = (expenseAmount > 0
			? expenseRows
			: []
		)
			.map((row) => ({
				category: row.category,
				label: categoryLabel(row.category),
				amount: toMoney(row.amount),
				percentage:
					expenseAmount > 0
						? roundPercentage(
								(toAmount(row.amount) / expenseAmount) * 100,
							)
						: 0,
			}))
			.sort(
				(a, b) =>
					toAmount(b.amount) - toAmount(a.amount) ||
					a.category.localeCompare(b.category),
			);

		const sortedProductRows = productRows
			.slice()
			.sort(
				(a, b) =>
					toAmount(b.revenueAmount) - toAmount(a.revenueAmount) ||
					b.quantitySold - a.quantitySold ||
					a.title.localeCompare(b.title),
			)
			.slice(0, 5);
		const leaderRevenue = toAmount(sortedProductRows[0]?.revenueAmount);
		const topProducts = sortedProductRows
			.map((row, index) => ({
				rank: index + 1,
				productId: row.productId,
				title: row.title,
				revenueAmount: toMoney(row.revenueAmount),
				quantitySold: row.quantitySold,
				percentageOfLeader:
					leaderRevenue > 0
						? roundPercentage(
								(toAmount(row.revenueAmount) / leaderRevenue) * 100,
							)
						: 0,
			}));

		const topCustomers = (salesAmount > 0 ? customerRows : [])
			.slice()
			.sort(
				(a, b) =>
					toAmount(b.salesAmount) - toAmount(a.salesAmount) ||
					b.completedOrderCount - a.completedOrderCount ||
					a.name.localeCompare(b.name),
			)
			.slice(0, 5)
			.map((row, index) => ({
				rank: index + 1,
				customerId: row.customerId,
				name: row.name,
				completedOrderCount: row.completedOrderCount,
				salesAmount: toMoney(row.salesAmount),
				percentageOfSales:
					salesAmount > 0
						? roundPercentage(
								(toAmount(row.salesAmount) / salesAmount) * 100,
							)
						: 0,
			}));

		const attention = buildStockAttention(stockRows);
		if (orderSnapshot.queuedOrderCount > 0) {
			attention.push({
				kind: 'queued_orders',
				severity: 'info',
				title: `${orderSnapshot.queuedOrderCount} ${plural(orderSnapshot.queuedOrderCount, 'order')} still waiting in the queue`,
				detail: `Orders · ₱${toMoney(orderSnapshot.queuedAmount)} not yet fulfilled`,
				targetModule: 'orders',
				entityId: null,
			});
		}
		const lapsedCustomer = buildLapsedCustomerAttention(
			customerCadence,
			now,
		);
		if (lapsedCustomer) attention.push(lapsedCustomer);
		const expenseAnomaly = buildExpenseAnomalyAttention(
			expenseHistory,
			now,
		);
		if (expenseAnomaly) attention.push(expenseAnomaly);

		return {
			asOf: now.toISOString(),
			range: {
				key: range.key,
				label: range.label,
				timeZone: DASHBOARD_TIME_ZONE,
				start: range.start.toISOString(),
				end: range.end.toISOString(),
			},
			basis: {
				completedOrderCount: salesSummary.completedOrderCount,
				expenseRecordCount: expenseSummary.expenseRecordCount,
			},
			metrics: {
				salesAmount: toMoney(salesAmount),
				expenseAmount: toMoney(expenseAmount),
				estimatedProfitAmount: toMoney(
					salesSummary.estimatedProfitAmount,
				),
				inaccurateSaleCount: salesSummary.inaccurateSaleCount,
				completedOrderCount: salesSummary.completedOrderCount,
				queuedOrderCount: orderSnapshot.queuedOrderCount,
				totalOrderCount: orderSnapshot.totalOrderCount,
			},
			cashflow,
			expenseBreakdown,
			attention: attention.slice(0, 5),
			topProducts,
			topCustomers,
		};
	}
}
