import { pgTable,  timestamp, varchar, serial, decimal, integer } from "drizzle-orm/pg-core"
import { sql } from 'drizzle-orm';
import { users } from '../schema/users'

export const products = pgTable('products', {
    id: serial('id').primaryKey().notNull(),
    name: varchar({ length: 50 }),
    description: varchar({ length: 100 }),
    category: varchar({ length: 50 }),
    sku: varchar({ length: 50 }),
    barcode: varchar({ length: 50 }),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }).notNull(),
    basePrice: decimal('base_price', { precision: 10, scale: 2 }),
    stock: integer().default(0),
    image: varchar({ length: 100 }),

    createdBy: varchar('created_by', { length: 100 }).references(() => users.clerkId),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export type Product = typeof products.$inferInsert;