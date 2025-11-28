import { pgTable, pgEnum, serial, timestamp, varchar, integer, numeric, index } from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm';
import { orders } from '../schema/orders'

export const transactionStatusEnum = pgEnum('transaction_status', ['success', 'failed', 'refunded'])

export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey().notNull(),
    orderId: integer('order_id').references(() => orders.id, {
        onDelete: 'set null'
    }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 30 }).notNull(),
    transactionStatus:  transactionStatusEnum('transaction_status'),
    referenceNumber: varchar('reference_number', { length: 100 }),

    createdBy: varchar('created_by', { length: 100 }),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedBy: varchar('updated_by', { length: 100 }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' })
}, (table) => {
    return{
        orderIdIdx: index('transactions_order_id_idx').on(table.orderId)
    }
})

export const transactionRelations = relations(transactions, ({ one }) => ({
    order: one(orders, {
        fields: [transactions.orderId],
        references: [orders.id]
    })
}))

export type Transaction = typeof transactions.$inferInsert