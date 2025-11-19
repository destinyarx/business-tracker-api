import { pgTable,  timestamp, varchar, serial, decimal, integer } from "drizzle-orm/pg-core"
import { sql } from 'drizzle-orm';
import { customers } from '../schema/customers'

export const schedule = pgTable('schedules', {
    id: serial('id').primaryKey().notNull(),
    title: varchar({ length: 50 }).notNull(),
    description: varchar({ length: 100 }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    scheduleDate: timestamp('schedule_date', { mode: 'string' }).notNull(),
    customerId: integer('customer_id').references(() => customers.id),

    createdBy: varchar('created_by', { length: 100 }),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export type Service = typeof schedule.$inferInsert;