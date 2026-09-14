import { and, count, eq, inArray, lte, or, sql, type SQL } from 'drizzle-orm';

import { db } from '../index';
import {
	accountErasureRequests,
	type AccountErasureRequest,
} from '../schema/account-erasure-requests';
import { customers } from '../schema/customers';
import { expenses } from '../schema/expenses';
import { orderItems } from '../schema/order_items';
import { orders } from '../schema/orders';
import { productVariants } from '../schema/product_variants';
import { products } from '../schema/products';
import { sales } from '../schema/sales';
import { schedule } from '../schema/schedules';
import { transactions } from '../schema/transactions';

export type AccountErasureDeletedCounts = {
	customers: number;
	expenses: number;
	orderItems: number;
	orders: number;
	productVariants: number;
	products: number;
	sales: number;
	schedules: number;
	transactions: number;
};

export type AccountErasureVerification = {
	ownedRows: number;
	dependentRows: number;
	residualActorRows: number;
};

export async function enqueueAccountErasure(
	webhookEventId: string,
	clerkUserId: string,
	subjectHash: string,
): Promise<{ created: boolean; request: AccountErasureRequest }> {
	return db.transaction(async (tx) => {
		const [inserted] = await tx
			.insert(accountErasureRequests)
			.values({ webhookEventId, clerkUserId, subjectHash })
			.onConflictDoNothing()
			.returning();

		if (inserted) return { created: true, request: inserted };

		const [existing] = await tx
			.select()
			.from(accountErasureRequests)
			.where(
				or(
					eq(accountErasureRequests.webhookEventId, webhookEventId),
					eq(accountErasureRequests.subjectHash, subjectHash),
				),
			)
			.for('update')
			.limit(1);

		if (!existing) {
			throw new Error('ACCOUNT_ERASURE_ENQUEUE_CONFLICT');
		}
		if (existing.subjectHash !== subjectHash) {
			throw new Error('ACCOUNT_ERASURE_EVENT_SUBJECT_MISMATCH');
		}

		if (existing.status === 'failed') {
			const [restarted] = await tx
				.update(accountErasureRequests)
				.set({
					clerkUserId,
					status: 'retry',
					attemptCount: 0,
					nextAttemptAt: new Date(),
					lastErrorCode: null,
				})
				.where(eq(accountErasureRequests.id, existing.id))
				.returning();

			return { created: false, request: restarted };
		}

		return { created: false, request: existing };
	});
}

export async function hasAccountErasureTombstone(
	subjectHash: string,
): Promise<boolean> {
	const [record] = await db
		.select({ id: accountErasureRequests.id })
		.from(accountErasureRequests)
		.where(eq(accountErasureRequests.subjectHash, subjectHash))
		.limit(1);

	return Boolean(record);
}

export async function claimAccountErasureRequest(
	processingTimeoutSeconds: number,
): Promise<AccountErasureRequest | undefined> {
	const now = new Date();
	const staleBefore = new Date(
		now.getTime() - processingTimeoutSeconds * 1000,
	);

	return db.transaction(async (tx) => {
		const [candidate] = await tx
			.select({ id: accountErasureRequests.id })
			.from(accountErasureRequests)
			.where(
				or(
					and(
						inArray(accountErasureRequests.status, [
							'pending',
							'retry',
						]),
						lte(accountErasureRequests.nextAttemptAt, now),
					),
					and(
						eq(accountErasureRequests.status, 'processing'),
						lte(accountErasureRequests.startedAt, staleBefore),
					),
				),
			)
			.orderBy(
				accountErasureRequests.nextAttemptAt,
				accountErasureRequests.id,
			)
			.for('update', { skipLocked: true })
			.limit(1);

		if (!candidate) return undefined;

		const [claimed] = await tx
			.update(accountErasureRequests)
			.set({
				status: 'processing',
				attemptCount: sql`${accountErasureRequests.attemptCount} + 1`,
				startedAt: now,
				lastErrorCode: null,
			})
			.where(eq(accountErasureRequests.id, candidate.id))
			.returning();

		return claimed;
	});
}

export async function markAccountErasureCheckpoint(
	id: number,
	checkpoint: 'databaseDeletedAt' | 'storageDeletedAt' | 'cacheDeletedAt',
): Promise<void> {
	await db
		.update(accountErasureRequests)
		.set({ [checkpoint]: new Date() })
		.where(eq(accountErasureRequests.id, id));
}

export async function scheduleAccountErasureReconciliation(
	id: number,
	nextAttemptAt: Date,
): Promise<void> {
	await db
		.update(accountErasureRequests)
		.set({
			status: 'retry',
			nextAttemptAt,
			startedAt: null,
			lastErrorCode: null,
		})
		.where(eq(accountErasureRequests.id, id));
}

export async function markAccountErasureFailure(
	id: number,
	status: 'retry' | 'failed',
	lastErrorCode: string,
	nextAttemptAt: Date,
): Promise<void> {
	await db
		.update(accountErasureRequests)
		.set({
			status,
			lastErrorCode,
			nextAttemptAt,
			startedAt: null,
		})
		.where(eq(accountErasureRequests.id, id));
}

export async function completeAccountErasure(id: number): Promise<void> {
	const now = new Date();
	await db
		.update(accountErasureRequests)
		.set({
			status: 'completed',
			clerkUserId: null,
			reconciledAt: now,
			completedAt: now,
			startedAt: null,
			lastErrorCode: null,
		})
		.where(eq(accountErasureRequests.id, id));
}

export async function retryFailedAccountErasure(id: number): Promise<boolean> {
	const [updated] = await db
		.update(accountErasureRequests)
		.set({
			status: 'retry',
			attemptCount: 0,
			nextAttemptAt: new Date(),
			lastErrorCode: null,
		})
		.where(
			and(
				eq(accountErasureRequests.id, id),
				eq(accountErasureRequests.status, 'failed'),
			),
		)
		.returning({ id: accountErasureRequests.id });

	return Boolean(updated);
}

export async function eraseOperatorDatabase(clerkUserId: string): Promise<{
	deleted: AccountErasureDeletedCounts;
	verification: AccountErasureVerification;
}> {
	return db.transaction(async (tx) => {
		const ownedCustomerIds = await selectIds(
			tx,
			customers,
			eq(customers.createdBy, clerkUserId),
		);
		const ownedOrderIds = await selectIds(
			tx,
			orders,
			eq(orders.createdBy, clerkUserId),
		);
		const ownedProductIds = await selectIds(
			tx,
			products,
			eq(products.createdBy, clerkUserId),
		);

		const deletedSales = await tx
			.delete(sales)
			.where(
				ownerOrRelated(
					eq(sales.createdBy, clerkUserId),
					sales.orderId,
					ownedOrderIds,
				),
			)
			.returning({ id: sales.id });
		const deletedTransactions = await tx
			.delete(transactions)
			.where(
				ownerOrRelated(
					eq(transactions.createdBy, clerkUserId),
					transactions.orderId,
					ownedOrderIds,
				),
			)
			.returning({ id: transactions.id });
		const deletedSchedules = await tx
			.delete(schedule)
			.where(
				ownerOrRelated(
					eq(schedule.createdBy, clerkUserId),
					schedule.customerId,
					ownedCustomerIds,
				),
			)
			.returning({ id: schedule.id });
		const deletedOrderItems = ownedOrderIds.length
			? await tx
					.delete(orderItems)
					.where(inArray(orderItems.orderId, ownedOrderIds))
					.returning({ id: orderItems.id })
			: [];
		const deletedOrders = await tx
			.delete(orders)
			.where(eq(orders.createdBy, clerkUserId))
			.returning({ id: orders.id });
		const deletedProductVariants = ownedProductIds.length
			? await tx
					.delete(productVariants)
					.where(inArray(productVariants.productId, ownedProductIds))
					.returning({ id: productVariants.id })
			: [];
		const deletedProducts = await tx
			.delete(products)
			.where(eq(products.createdBy, clerkUserId))
			.returning({ id: products.id });
		const deletedExpenses = await tx
			.delete(expenses)
			.where(eq(expenses.createdBy, clerkUserId))
			.returning({ id: expenses.id });
		const deletedCustomers = await tx
			.delete(customers)
			.where(eq(customers.createdBy, clerkUserId))
			.returning({ id: customers.id });

		const verification = await verifyWithClient(
			tx,
			clerkUserId,
			ownedCustomerIds,
			ownedOrderIds,
			ownedProductIds,
		);

		return {
			deleted: {
				customers: deletedCustomers.length,
				expenses: deletedExpenses.length,
				orderItems: deletedOrderItems.length,
				orders: deletedOrders.length,
				productVariants: deletedProductVariants.length,
				products: deletedProducts.length,
				sales: deletedSales.length,
				schedules: deletedSchedules.length,
				transactions: deletedTransactions.length,
			},
			verification,
		};
	});
}

export async function verifyOperatorDatabase(
	clerkUserId: string,
): Promise<AccountErasureVerification> {
	return db.transaction(async (tx) => {
		const ownedCustomerIds = await selectIds(
			tx,
			customers,
			eq(customers.createdBy, clerkUserId),
		);
		const ownedOrderIds = await selectIds(
			tx,
			orders,
			eq(orders.createdBy, clerkUserId),
		);
		const ownedProductIds = await selectIds(
			tx,
			products,
			eq(products.createdBy, clerkUserId),
		);

		return verifyWithClient(
			tx,
			clerkUserId,
			ownedCustomerIds,
			ownedOrderIds,
			ownedProductIds,
		);
	});
}

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
type IdTable = typeof customers | typeof orders | typeof products;

async function selectIds(
	tx: TransactionClient,
	table: IdTable,
	where: SQL,
): Promise<number[]> {
	const rows = await tx.select({ id: table.id }).from(table).where(where);
	return rows.map((row) => row.id);
}

function ownerOrRelated(
	ownerCondition: SQL,
	relationColumn:
		| typeof sales.orderId
		| typeof transactions.orderId
		| typeof schedule.customerId,
	ids: number[],
): SQL {
	return ids.length
		? (or(ownerCondition, inArray(relationColumn, ids)) as SQL)
		: ownerCondition;
}

async function verifyWithClient(
	tx: TransactionClient,
	clerkUserId: string,
	ownedCustomerIds: number[],
	ownedOrderIds: number[],
	ownedProductIds: number[],
): Promise<AccountErasureVerification> {
	const ownedCounts = await Promise.all([
		rowCount(tx, customers, eq(customers.createdBy, clerkUserId)),
		rowCount(tx, products, eq(products.createdBy, clerkUserId)),
		rowCount(tx, orders, eq(orders.createdBy, clerkUserId)),
		rowCount(tx, sales, eq(sales.createdBy, clerkUserId)),
		rowCount(tx, expenses, eq(expenses.createdBy, clerkUserId)),
		rowCount(tx, transactions, eq(transactions.createdBy, clerkUserId)),
		rowCount(tx, schedule, eq(schedule.createdBy, clerkUserId)),
	]);
	const dependentCounts = await Promise.all([
		ownedOrderIds.length
			? rowCount(
					tx,
					orderItems,
					inArray(orderItems.orderId, ownedOrderIds),
				)
			: Promise.resolve(0),
		ownedOrderIds.length
			? rowCount(tx, sales, inArray(sales.orderId, ownedOrderIds))
			: Promise.resolve(0),
		ownedOrderIds.length
			? rowCount(
					tx,
					transactions,
					inArray(transactions.orderId, ownedOrderIds),
				)
			: Promise.resolve(0),
		ownedProductIds.length
			? rowCount(
					tx,
					productVariants,
					inArray(productVariants.productId, ownedProductIds),
				)
			: Promise.resolve(0),
		ownedCustomerIds.length
			? rowCount(
					tx,
					schedule,
					inArray(schedule.customerId, ownedCustomerIds),
				)
			: Promise.resolve(0),
	]);
	const actorCounts = await Promise.all([
		rowCount(tx, customers, eq(customers.updatedBy, clerkUserId)),
		rowCount(tx, products, eq(products.updatedBy, clerkUserId)),
		rowCount(tx, orders, eq(orders.updatedBy, clerkUserId)),
		rowCount(tx, expenses, eq(expenses.updatedBy, clerkUserId)),
		rowCount(tx, transactions, eq(transactions.updatedBy, clerkUserId)),
		rowCount(
			tx,
			sales,
			or(
				eq(sales.recognizedBy, clerkUserId),
				eq(sales.revertedBy, clerkUserId),
			) as SQL,
		),
	]);

	return {
		ownedRows: sum(ownedCounts),
		dependentRows: sum(dependentCounts),
		residualActorRows: sum(actorCounts),
	};
}

async function rowCount(
	tx: TransactionClient,
	table:
		| typeof customers
		| typeof products
		| typeof orders
		| typeof sales
		| typeof expenses
		| typeof transactions
		| typeof schedule
		| typeof orderItems
		| typeof productVariants,
	where: SQL,
): Promise<number> {
	const [result] = await tx
		.select({ value: count() })
		.from(table)
		.where(where);
	return result.value;
}

function sum(values: number[]): number {
	return values.reduce((total, value) => total + value, 0);
}
