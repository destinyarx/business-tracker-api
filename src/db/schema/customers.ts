import { pgTable,  timestamp, varchar, serial } from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'
import { orders } from './orders'

export const customers = pgTable('customers', {
    id: serial('id').primaryKey().notNull(),
    name: varchar({ length: 100 }),
    gender: varchar({ length: 10 }),
    email: varchar({ length: 50 }),
    customerType: varchar('customer_type', { length: 20 }),
    phone: varchar({ length: 20 }),
    status: varchar({ length: 30 }),
    notes: varchar({ length: 50 }),
    
    createdBy: varchar('created_by', { length: 100 }),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedBy: varchar('updated_by', { length: 100 }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
})

export const customerRelations = relations(customers, ({many}) => ({
    orders: many(orders)
}))

export type Customer = typeof customers.$inferInsert