import { pgTable,  timestamp, varchar, serial, decimal, integer } from "drizzle-orm/pg-core"
import { sql, relations } from 'drizzle-orm';
import { productVariants } from './product_variants'

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
    image: varchar('image', { length: 255 }),
    imageUrl: varchar('image_url', { length: 255 }),
    imageSource: varchar('image_source', { length: 10 }),

    createdBy: varchar('created_by', { length: 100 }),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedBy: varchar('updated_by', { length: 100 }),
    updatedAt: timestamp('updated_at', { mode: 'date' }),
});

export const productRelations = relations(productVariants, ({ many }) => ({
    variants: many(productVariants)
}))

export type Product = typeof products.$inferInsert;