import type { DashboardRange } from './dto/get-dashboard.dto';

export type DashboardCashflowBucket = {
	key: string;
	label: string;
	start: string;
	end: string;
	salesAmount: string;
	expenseAmount: string;
	netAmount: string;
};

export type DashboardExpenseCategory = {
	category: string;
	label: string;
	amount: string;
	percentage: number;
};

export type DashboardAttentionKind =
	| 'out_of_stock'
	| 'low_stock'
	| 'queued_orders'
	| 'lapsed_customer'
	| 'expense_anomaly';

export type DashboardAttentionSeverity =
	| 'critical'
	| 'warning'
	| 'info'
	| 'insight';

export type DashboardTargetModule =
	| 'inventory'
	| 'orders'
	| 'customers'
	| 'expenses';

export type DashboardAttention = {
	kind: DashboardAttentionKind;
	severity: DashboardAttentionSeverity;
	title: string;
	detail: string;
	targetModule: DashboardTargetModule;
	entityId: number | null;
};

export type DashboardTopProduct = {
	rank: number;
	productId: number | null;
	title: string;
	revenueAmount: string;
	quantitySold: number;
	percentageOfLeader: number;
};

export type DashboardTopCustomer = {
	rank: number;
	customerId: number | null;
	name: string;
	completedOrderCount: number;
	salesAmount: string;
	percentageOfSales: number;
};

export type DashboardOverview = {
	asOf: string;
	range: {
		key: DashboardRange;
		label: string;
		timeZone: 'Asia/Manila';
		start: string;
		end: string;
	};
	basis: {
		completedOrderCount: number;
		expenseRecordCount: number;
	};
	metrics: {
		salesAmount: string;
		expenseAmount: string;
		estimatedProfitAmount: string;
		inaccurateSaleCount: number;
		completedOrderCount: number;
		queuedOrderCount: number;
		totalOrderCount: number;
	};
	cashflow: DashboardCashflowBucket[];
	expenseBreakdown: DashboardExpenseCategory[];
	attention: DashboardAttention[];
	topProducts: DashboardTopProduct[];
	topCustomers: DashboardTopCustomer[];
};
