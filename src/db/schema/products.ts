import { pgTable,  timestamp, varchar, serial, decimal, integer } from "drizzle-orm/pg-core"
import { sql } from 'drizzle-orm';

export const products = pgTable('products', {
    id: serial('id').primaryKey().notNull(),
    name: varchar({ length: 50 }).notNull(),
    description: varchar({ length: 100 }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").default(0),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export type Products = typeof products.$inferInsert;