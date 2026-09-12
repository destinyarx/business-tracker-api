import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	isNotNull,
	isNull,
	lt,
	lte,
	or,
	sql,
} from 'drizzle-orm';
import type { DashboardDateRange } from '../../../features/dashboard/dashboard-date-range';
import { db } from '../index';
import { expenses } from '../schema/expenses';
import { orderItems } from '../schema/order_items';
import { orders } from '../schema/orders';
import { products } from '../schema/products';
import { sales } from '../schema/sales';

const saleDay = sql<string>`to_char(${sales.recognizedAt} AT TIME ZONE 'Asia/Manila', 'YYYY-MM-DD')`;
const expenseLocalDate = sql`(${expenses.dateIncurred} AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Manila'`;
const expenseDay = sql<string>`to_char(${expenseLocalDate}, 'YYYY-MM-DD')`;
const expenseMonth = sql<string>`to_char(${expenseLocalDate}, 'YYYY-MM')`;
const normalizedExpenseCategory = sql<string>`case
	when ${expenses.category} = 'other'
		then coalesce(nullif(lower(trim(${expenses.categoryOther})), ''), 'other')
	else ${expenses.category}::text
end`;

export type DashboardSalesSummaryRow = {
	completedOrderCount: number;
	salesAmount: string;
	estimatedProfitAmount: string;
	inaccurateSaleCount: number;
};

export type DashboardExpenseSummaryRow = {
	expenseRecordCount: number;
	expenseAmount: string;
};

export type DashboardDailyAmountRow = {
	day: string;
	amount: string;
};

export type DashboardExpenseBreakdownRow = {
	category: string;
	amount: string;
};

export type DashboardOrderSnapshotRow = {
	queuedOrderCount: number;
	totalOrderCount: number;
	queuedAmount: string;
};

export type DashboardStockRow = {
	productId: number;
	title: string | null;
	stock: number;
};

export type DashboardTopProductRow = {
	productId: number | null;
	title: string;
	revenueAmount: string;
	quantitySold: number;
};

export type DashboardTopCustomerRow = {
	customerId: number | null;
	name: string;
	completedOrderCount: number;
	salesAmount: string;
};

export type DashboardCustomerSaleRow = {
	customerId: number;
	customerName: string | null;
	recognizedAt: Date;
};

export type DashboardExpenseHistoryRow = {
	month: string;
	category: string;
	amount: string;
};

function activeSalesInRange(userId: string, range: DashboardDateRange) {
	return and(
		eq(sales.createdBy, userId),
		eq(sales.state, 'active'),
		gte(sales.recognizedAt, range.start),
		lte(sales.recognizedAt, range.end),
	);
}

function activeExpensesInRange(userId: string, range: DashboardDateRange) {
	return and(
		eq(expenses.createdBy, userId),
		isNull(expenses.deletedAt),
		gte(expenses.dateIncurred, range.start),
		lte(expenses.dateIncurred, range.end),
	);
}

export async function getDashboardSalesSummary(
	userId: string,
	range: DashboardDateRange,
): Promise<DashboardSalesSummaryRow> {
	const [row] = await db
		.select({
			completedOrderCount: sql<number>`count(*)::int`,
			salesAmount: sql<string>`coalesce(sum(${sales.totalAmount}), 0)::text`,
			estimatedProfitAmount: sql<string>`coalesce(sum(${sales.totalProfit}), 0)::text`,
			inaccurateSaleCount: sql<number>`count(*) filter (where ${sales.profitInaccurate} = true)::int`,
		})
		.from(sales)
		.where(activeSalesInRange(userId, range));

	return row;
}

export async function getDashboardCashflowSales(
	userId: string,
	range: DashboardDateRange,
): Promise<DashboardDailyAmountRow[]> {
	return db
		.select({
			day: saleDay,
			amount: sql<string>`sum(${sales.totalAmount})::text`,
		})
		.from(sales)
		.where(activeSalesInRange(userId, range))
		.groupBy(saleDay)
		.orderBy(asc(saleDay));
}

export async function getDashboardExpenseSummary(
	userId: string,
	range: DashboardDateRange,
): Promise<DashboardExpenseSummaryRow> {
	const [row] = await db
		.select({
			expenseRecordCount: sql<number>`count(*)::int`,
			expenseAmount: sql<string>`coalesce(sum(${expenses.amount}), 0)::text`,
		})
		.from(expenses)
		.where(activeExpensesInRange(userId, range));

	return row;
}

export async function getDashboardCashflowExpenses(
	userId: string,
	range: DashboardDateRange,
): Promise<DashboardDailyAmountRow[]> {
	return db
		.select({
			day: expenseDay,
			amount: sql<string>`sum(${expenses.amount})::text`,
		})
		.from(expenses)
		.where(activeExpensesInRange(userId, range))
		.groupBy(expenseDay)
		.orderBy(asc(expenseDay));
}

export async function getDashboardExpenseBreakdown(
	userId: string,
	range: DashboardDateRange,
): Promise<DashboardExpenseBreakdownRow[]> {
	const amount = sql<string>`sum(${expenses.amount})::text`;
	return db
		.select({ category: normalizedExpenseCategory, amount })
		.from(expenses)
		.where(activeExpensesInRange(userId, range))
		.groupBy(normalizedExpenseCategory)
		.orderBy(desc(amount), asc(normalizedExpenseCategory));
}

export async function getDashboardOrderSnapshot(
	userId: string,
): Promise<DashboardOrderSnapshotRow> {
	const queued = sql`${orders.status} in ('pending', 'in_progress')`;
	const [row] = await db
		.select({
			queuedOrderCount: sql<number>`count(*) filter (where ${queued})::int`,
			totalOrderCount: sql<number>`count(*)::int`,
			queuedAmount: sql<string>`coalesce(sum(case when ${queued} then ${orders.totalAmount} else 0 end), 0)::text`,
		})
		.from(orders)
		.where(and(eq(orders.createdBy, userId), isNull(orders.deletedAt)));

	return row;
}

export async function getDashboardStockSnapshot(
	userId: string,
): Promise<DashboardStockRow[]> {
	return db
		.select({
			productId: products.id,
			title: products.title,
			stock: sql<number>`coalesce(${products.stock}, 0)::int`,
		})
		.from(products)
		.where(
			and(
				eq(products.createdBy, userId),
				or(
					eq(products.stock, 0),
					and(gt(products.stock, 0), lt(products.stock, 10)),
				),
			),
		)
		.orderBy(asc(products.stock), asc(products.id));
}

export async function getDashboardTopProducts(
	userId: string,
	range: DashboardDateRange,
): Promise<DashboardTopProductRow[]> {
	const title = sql<string>`case
		when ${products.id} is null then 'Deleted product'
		else coalesce(nullif(${products.title}, ''), 'Untitled product')
	end`;
	const revenueAmount = sql<string>`sum(${orderItems.subtotal})::text`;
	const quantitySold = sql<number>`sum(${orderItems.quantity})::int`;

	return db
		.select({
			productId: products.id,
			title,
			revenueAmount,
			quantitySold,
		})
		.from(sales)
		.innerJoin(
			orders,
			and(
				eq(orders.id, sales.orderId),
				eq(orders.createdBy, userId),
				isNull(orders.deletedAt),
			),
		)
		.innerJoin(orderItems, eq(orderItems.orderId, orders.id))
		.leftJoin(
			products,
			and(
				eq(products.id, orderItems.productId),
				eq(products.createdBy, userId),
			),
		)
		.where(activeSalesInRange(userId, range))
		.groupBy(products.id, title)
		.orderBy(desc(revenueAmount), desc(quantitySold), asc(title))
		.limit(5);
}

export async function getDashboardTopCustomers(
	userId: string,
	range: DashboardDateRange,
): Promise<DashboardTopCustomerRow[]> {
	const name = sql<string>`case
		when ${sales.customerId} is null then 'Guest customer'
		else coalesce(nullif(${sales.customerName}, ''), 'Unnamed customer')
	end`;
	const salesAmount = sql<string>`sum(${sales.totalAmount})::text`;
	const completedOrderCount = sql<number>`count(*)::int`;

	return db
		.select({
			customerId: sales.customerId,
			name,
			completedOrderCount,
			salesAmount,
		})
		.from(sales)
		.where(activeSalesInRange(userId, range))
		.groupBy(sales.customerId, name)
		.orderBy(desc(salesAmount), desc(completedOrderCount), asc(name))
		.limit(5);
}

export async function getDashboardCustomerCadence(
	userId: string,
): Promise<DashboardCustomerSaleRow[]> {
	return db
		.select({
			customerId: sql<number>`${sales.customerId}::int`,
			customerName: sales.customerName,
			recognizedAt: sales.recognizedAt,
		})
		.from(sales)
		.where(
			and(
				eq(sales.createdBy, userId),
				eq(sales.state, 'active'),
				isNotNull(sales.customerId),
			),
		)
		.orderBy(asc(sales.customerId), asc(sales.recognizedAt));
}

export async function getDashboardExpenseHistory(
	userId: string,
	start: Date,
	end: Date,
): Promise<DashboardExpenseHistoryRow[]> {
	const amount = sql<string>`sum(${expenses.amount})::text`;
	return db
		.select({
			month: expenseMonth,
			category: normalizedExpenseCategory,
			amount,
		})
		.from(expenses)
		.where(
			and(
				eq(expenses.createdBy, userId),
				isNull(expenses.deletedAt),
				gte(expenses.dateIncurred, start),
				lte(expenses.dateIncurred, end),
			),
		)
		.groupBy(expenseMonth, normalizedExpenseCategory)
		.orderBy(asc(expenseMonth), asc(normalizedExpenseCategory));
}
