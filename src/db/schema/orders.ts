import { pgTable, pgEnum, timestamp, varchar, serial, integer, numeric, index } from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'
import { customers } from '../schema/customers'
import { orderItems } from '../schema/order_items'

export const orderStatusEnum = pgEnum('order_status', ['pending', 'in_progress', 'success', 'failed', 'reverted'])

export const orders = pgTable('orders', {
    id: serial('id').primaryKey().notNull(),
    customerId: integer('customer_id').references(() => customers.id, {
        onDelete: 'set null'
    }),
    orderName: varchar('order_name', { length: 50 }),
    orderStatus: orderStatusEnum('order_status').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),

    createdBy: varchar('created_by', { length: 100 }),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedBy: varchar('updated_by', { length: 100 }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
}, (table) => {
    return {
        customerIdIdx: index('orders_user_id_idx').on(table.customerId)
    }
})

export const ordersRelations = relations(orders, ({ many, one }) => ({
    items: many(orderItems),
    customer: one(customers, {
        fields: [orders.customerId],
        references: [customers.id]
    })
}))

export type Order = typeof orders.$inferInsert