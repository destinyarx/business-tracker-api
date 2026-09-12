import { db } from '../index';
import {
	eq,
	isNull,
	desc,
	asc,
	and,
	inArray,
	ilike,
	or,
	gte,
	lte,
} from 'drizzle-orm';
import { orders } from '../schema/orders';
import { products } from '../schema/products';
import { orderItems } from '../schema/order_items';
import { customers } from '../schema/customers';
import { sales } from '../schema/sales';
import { CreateOrderItemDto } from '../../../features/orders/dto/create-order-item-dto';
import { UpdateOrderStatusDto } from '../../../features/orders/dto/update-order-status-dto';
import { GetOrderDto } from '../../../features/orders/dto/get-order.dto';
import type { Order } from '../schema/orders';
import type { Product } from '../schema/products';
import type { OrderStatus } from '../../../features/orders/dto/create-order.dto';
import { getOrderTransition } from '../../../features/orders/order-status';
import {
	getDateRangeFromPeriod,
	type TimePeriod,
} from '../../../common/utils/date-range';

type Tx = Parameters<typeof db.transaction>[0] extends (tx: infer T) => any
	? T
	: never;

type OrderItem = Product & {
	quantity: number;
};

type OrderData = Order & {
	orderItems: OrderItem[];
};

export async function addOrder(userId: string, data: OrderData) {
	let profitInaccurate: boolean = false;
	let totalProfit: number = 0;

	data.orderItems.map((item) => {
		if (item.profit) {
			totalProfit += item.profit * item.quantity;
		} else {
			profitInaccurate = true;
		}
	});

	await db.transaction(async (tx) => {
		const insertedOrder = await tx
			.insert(orders)
			.values({
				customerId: data.customerId,
				orderName: data.orderName,
				status: 'pending',
				notes: data.notes,
				totalAmount: String(data.totalAmount),
				totalProfit: String(totalProfit),
				profitInaccurate: profitInaccurate,
				createdBy: userId,
			})
			.returning({ id: orders.id });

		const items = data.orderItems.map((item) => ({
			orderId: insertedOrder[0].id,
			productId: item.id,
			priceAtPurchase: item.price.toFixed(2),
			quantity: item.quantity,
			subtotal: (Number(item.price) * Number(item.quantity)).toFixed(2),
		}));

		await tx.insert(orderItems).values(items);

		return insertedOrder;
	});
}

export async function addOrderItems(id: number, items: CreateOrderItemDto[]) {
	await db.insert(orderItems).values(
		items.map((item) => {
			const priceAtPurchase = item.price.toString();

			return {
				orderId: id,
				productId: item.id,
				quantity: item.quantity,
				priceAtPurchase: priceAtPurchase,
				subtotal: (item.quantity * item.price).toString(),
			};
		}),
	);
}

export async function getOrdersPaginated(params: GetOrderDto, userId: string) {
	const range = params?.timePeriod
		? getDateRangeFromPeriod(params.timePeriod as TimePeriod)
		: undefined;
	const orderBy: any[] = [];

	orderBy.push(
		params?.sort === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt),
	);

	if (params?.sortByStatus) {
		orderBy.push(
			params.sortByStatus === 'asc'
				? asc(orders.statusUpdatedAt)
				: desc(orders.statusUpdatedAt),
		);
	}

	const result = await db.query.orders.findMany({
		where: and(
			eq(orders.createdBy, userId),
			isNull(orders.deletedAt),

			params?.searchKey
				? or(
						ilike(orders.orderName, `%${params.searchKey}%`),
						ilike(orders.notes, `%${params.searchKey}%`),
					)
				: undefined,

			params?.filter && params.filter !== 'all'
				? eq(orders.status, params.filter as OrderStatus)
				: undefined,

			params?.timePeriod
				? and(
						gte(
							params?.sortByStatus
								? orders.statusUpdatedAt
								: orders.createdAt,
							range!.start,
						),
						lte(
							params?.sortByStatus
								? orders.statusUpdatedAt
								: orders.createdAt,
							range!.end,
						),
					)
				: undefined,
		),
		orderBy: orderBy,
		with: {
			items: {
				columns: {
					quantity: true,
					priceAtPurchase: true,
					subtotal: true,
				},
				with: {
					product: {
						columns: {
							id: true,
							title: true,
							price: true,
							profit: true,
						},
					},
				},
			},
			customer: {
				columns: { name: true },
			},
		},
		limit: params.limit ? params.limit + 1 : undefined,
		offset: params.offset ?? undefined,
	});

	let hasNext = false;
	if (params.limit && result?.length > params.limit) {
		hasNext = true;
		result.pop();
	}

	return {
		orders: result,
		hasNext: hasNext,
	};
}

export async function getOrderById(id: number, userId: string) {
	return await db.query.orders.findFirst({
		where: and(
			eq(orders.id, id),
			eq(orders.createdBy, userId),
			isNull(orders.deletedAt),
		),
		orderBy: desc(orders.createdAt),
		with: {
			items: {
				with: {
					product: true,
				},
			},
			customer: true,
		},
	});
}

export async function updateOrder(
	id: number,
	data: Partial<Order>,
	userId: string,
) {
	return db.transaction(async (tx) => {
		const [order] = await tx
			.select({ id: orders.id, status: orders.status })
			.from(orders)
			.where(and(eq(orders.id, id), eq(orders.createdBy, userId)))
			.for('update');

		if (!order) return { kind: 'not_found' as const };
		if (order.status === 'completed') {
			return { kind: 'completed' as const };
		}

		const [existingSale] = await tx
			.select({ id: sales.id })
			.from(sales)
			.where(and(eq(sales.orderId, id), eq(sales.createdBy, userId)))
			.limit(1);

		const [updated] = await tx
			.update(orders)
			.set({
				...data,
				updatedAt: new Date(),
				updatedBy: userId,
			})
			.where(and(eq(orders.id, id), eq(orders.createdBy, userId)))
			.returning({ id: orders.id });

		return {
			kind: 'updated' as const,
			id: updated.id,
			hadSale: Boolean(existingSale),
		};
	});
}

export async function deleteOrder(id: number, userId: string) {
	return db.transaction(async (tx) => {
		const [order] = await tx
			.select({ id: orders.id })
			.from(orders)
			.where(and(eq(orders.id, id), eq(orders.createdBy, userId)))
			.for('update');

		if (!order) return { kind: 'not_found' as const };

		const [existingSale] = await tx
			.select({ id: sales.id })
			.from(sales)
			.where(and(eq(sales.orderId, id), eq(sales.createdBy, userId)))
			.limit(1);

		if (existingSale) return { kind: 'has_sale' as const };

		await tx
			.delete(orders)
			.where(and(eq(orders.id, id), eq(orders.createdBy, userId)));

		return { kind: 'deleted' as const, id };
	});
}

export async function updateOrderStatus(
	id: number,
	data: UpdateOrderStatusDto,
	userId: string,
) {
	return db.transaction(async (tx) => {
		const [order] = await tx
			.select()
			.from(orders)
			.where(and(eq(orders.id, id), eq(orders.createdBy, userId)))
			.for('update');

		if (!order) return { kind: 'not_found' as const };

		const currentStatus = order.status;
		const transition = getOrderTransition(currentStatus, data.status);
		if (!transition.allowed) return { kind: 'invalid_transition' as const };
		if (currentStatus === data.status) {
			return { kind: 'unchanged' as const, id };
		}

		const reversalReason = data.reversalReason?.trim();
		if (transition.sale === 'revert' && !reversalReason) {
			return { kind: 'missing_reversal_reason' as const };
		}

		const [existingSale] = await tx
			.select({ id: sales.id })
			.from(sales)
			.where(and(eq(sales.orderId, id), eq(sales.createdBy, userId)))
			.limit(1);

		if (transition.sale === 'revert' && !existingSale) {
			return { kind: 'sale_not_found' as const };
		}

		const persistedItems = await tx
			.select({
				productId: orderItems.productId,
				quantity: orderItems.quantity,
			})
			.from(orderItems)
			.where(eq(orderItems.orderId, id));

		if (transition.stock !== 'none') {
			const stockResult = await applyStockEffect(
				tx,
				persistedItems,
				transition.stock,
				userId,
			);
			if (stockResult !== 'updated') {
				return { kind: stockResult } as const;
			}
		}

		const now = new Date();
		if (transition.sale === 'activate') {
			if (order.totalAmount === null) {
				return { kind: 'invalid_order_total' as const };
			}

			const customer = order.customerId
				? await tx
						.select({ name: customers.name })
						.from(customers)
						.where(
							and(
								eq(customers.id, order.customerId),
								eq(customers.createdBy, userId),
							),
						)
						.limit(1)
				: [];

			await tx
				.insert(sales)
				.values({
					orderId: order.id,
					customerId: order.customerId,
					customerName: customer[0]?.name,
					orderName: order.orderName,
					totalAmount: order.totalAmount,
					totalProfit: order.totalProfit,
					profitInaccurate: order.profitInaccurate ?? false,
					notes: order.notes,
					state: 'active',
					recognizedAt: now,
					recognizedBy: userId,
					createdBy: userId,
				})
				.onConflictDoUpdate({
					target: sales.orderId,
					set: {
						customerId: order.customerId,
						customerName: customer[0]?.name,
						orderName: order.orderName,
						totalAmount: order.totalAmount,
						totalProfit: order.totalProfit,
						profitInaccurate: order.profitInaccurate ?? false,
						notes: order.notes,
						state: 'active',
						recognizedAt: now,
						recognizedBy: userId,
						updatedAt: now,
					},
				});
		} else if (transition.sale === 'revert') {
			await tx
				.update(sales)
				.set({
					state: 'reverted',
					revertedAt: now,
					revertedBy: userId,
					reversalReason,
					updatedAt: now,
				})
				.where(and(eq(sales.orderId, id), eq(sales.createdBy, userId)));
		}

		await tx
			.update(orders)
			.set({
				status: data.status,
				statusUpdatedAt: now,
				updatedAt: now,
				updatedBy: userId,
			})
			.where(and(eq(orders.id, id), eq(orders.createdBy, userId)));

		return { kind: 'updated' as const, id };
	});
}

async function applyStockEffect(
	tx: Tx,
	items: { productId: number | null; quantity: number }[],
	effect: 'deduct' | 'restore',
	userId: string,
): Promise<'updated' | 'insufficient_stock' | 'product_not_found'> {
	const quantities = new Map<number, number>();
	for (const item of items) {
		if (item.productId === null) return 'product_not_found';
		quantities.set(
			item.productId,
			(quantities.get(item.productId) ?? 0) + item.quantity,
		);
	}

	const productIds = [...quantities.keys()];
	if (productIds.length === 0) return 'updated';

	const currentProducts = await tx
		.select({ id: products.id, stock: products.stock })
		.from(products)
		.where(
			and(
				inArray(products.id, productIds),
				eq(products.createdBy, userId),
			),
		)
		.for('update');

	if (currentProducts.length !== productIds.length) {
		return 'product_not_found';
	}

	for (const product of currentProducts) {
		const quantity = quantities.get(product.id) ?? 0;
		const currentStock = product.stock ?? 0;
		if (effect === 'deduct' && currentStock < quantity) {
			return 'insufficient_stock';
		}
	}

	for (const product of currentProducts) {
		const quantity = quantities.get(product.id) ?? 0;
		const currentStock = product.stock ?? 0;
		await tx
			.update(products)
			.set({
				stock:
					effect === 'deduct'
						? currentStock - quantity
						: currentStock + quantity,
			})
			.where(
				and(
					eq(products.id, product.id),
					eq(products.createdBy, userId),
				),
			);
	}

	return 'updated';
}
