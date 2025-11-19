import { pgTable,  timestamp, varchar, serial, decimal, integer } from "drizzle-orm/pg-core"
import { sql } from 'drizzle-orm';

export const products = pgTable('products', {
    id: serial('id').primaryKey().notNull(),
    title: varchar({ length: 50 }),
    description: varchar({ length: 100 }),
    category: varchar({ length: 50 }),
    sku: varchar({ length: 50 }),
    supplier: varchar({ length: 50 }),
    barcode: varchar({ length: 50 }),
    price: decimal('price', { precision: 10, scale: 2, mode: 'number' }).notNull(),
    profit: decimal('profit', { precision: 10, scale: 2, mode: 'number' }),
    stock: integer().default(0),
    image: varchar({ length: 100 }),

    createdBy: varchar('created_by', { length: 100 }),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export type Product = typeof products.$inferInsert;