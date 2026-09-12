import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import type {
	SaleStateFilter,
	SalesSortDirection,
} from '../../../features/sales/dto/get-sales.dto';
import type { SalesDateRange } from '../../../features/sales/sales-date-range';
import { db } from '../index';
import { sales } from '../schema/sales';

const saleRelations = {
	order: {
		columns: { id: true },
		with: {
			items: {
				columns: {
					id: true,
					productId: true,
					quantity: true,
					priceAtPurchase: true,
					subtotal: true,
				},
				with: {
					product: {
						columns: { id: true, title: true },
					},
				},
			},
		},
	},
} as const;

function toSaleRecord<T extends { order: { items: unknown[] } | null }>(
	row: T,
) {
	const { order, ...sale } = row;
	return { ...sale, orderItems: order?.items ?? [] };
}

export async function getSales(
	userId: string,
	dateRange: SalesDateRange,
	state: SaleStateFilter,
	sort: SalesSortDirection,
) {
	const rows = await db.query.sales.findMany({
		where: and(
			eq(sales.createdBy, userId),
			state === 'all' ? undefined : eq(sales.state, state),
			gte(sales.recognizedAt, dateRange.start),
			lte(sales.recognizedAt, dateRange.end),
		),
		orderBy:
			sort === 'asc'
				? [asc(sales.recognizedAt), asc(sales.id)]
				: [desc(sales.recognizedAt), desc(sales.id)],
		with: saleRelations,
	});

	return rows.map(toSaleRecord);
}

export async function getSaleById(id: number, userId: string) {
	const row = await db.query.sales.findFirst({
		where: and(eq(sales.id, id), eq(sales.createdBy, userId)),
		with: saleRelations,
	});

	return row ? toSaleRecord(row) : undefined;
}
