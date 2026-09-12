import { relations, sql } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	numeric,
	pgEnum,
	pgTable,
	serial,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { orders } from './orders';

export const saleStateEnum = pgEnum('sale_state', ['active', 'reverted']);

export const sales = pgTable(
	'sales',
	{
		id: serial('id').primaryKey().notNull(),
		orderId: integer('order_id')
			.notNull()
			.references(() => orders.id, { onDelete: 'restrict' }),
		customerId: integer('customer_id').references(() => customers.id, {
			onDelete: 'set null',
		}),
		customerName: varchar('customer_name', { length: 100 }),
		orderName: varchar('order_name', { length: 50 }),
		totalAmount: numeric('total_amount', {
			precision: 12,
			scale: 2,
		}).notNull(),
		totalProfit: numeric('total_profit', { precision: 12, scale: 2 }),
		profitInaccurate: boolean('is_profit_inaccurate')
			.default(false)
			.notNull(),
		notes: varchar('notes', { length: 500 }),
		state: saleStateEnum('state').default('active').notNull(),
		recognizedAt: timestamp('recognized_at', {
			mode: 'date',
			withTimezone: true,
		}).notNull(),
		recognizedBy: varchar('recognized_by', { length: 100 }).notNull(),
		revertedAt: timestamp('reverted_at', {
			mode: 'date',
			withTimezone: true,
		}),
		revertedBy: varchar('reverted_by', { length: 100 }),
		reversalReason: varchar('reversal_reason', { length: 500 }),
		createdBy: varchar('created_by', { length: 100 }).notNull(),
		createdAt: timestamp('created_at', {
			mode: 'date',
			withTimezone: true,
		})
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp('updated_at', {
			mode: 'date',
			withTimezone: true,
		}),
	},
	(table) => ({
		orderIdIdx: uniqueIndex('sales_order_id_idx').on(table.orderId),
		createdByIdx: index('sales_created_by_idx').on(table.createdBy),
	}),
);

export const salesRelations = relations(sales, ({ one }) => ({
	order: one(orders, {
		fields: [sales.orderId],
		references: [orders.id],
	}),
	customer: one(customers, {
		fields: [sales.customerId],
		references: [customers.id],
	}),
}));

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
