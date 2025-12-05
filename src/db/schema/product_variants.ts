// drizzle/schema/product-variations.ts
import { pgTable, serial, integer, varchar, decimal, timestamp, index } from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'
import { products } from './products'

export const productVariants = pgTable('product_variations', {
  id: serial('id').primaryKey().notNull(),

  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(),

  price: decimal('price', { precision: 10, scale: 2, mode: 'number' }).notNull(),
  stock: integer('stock').default(0),

  sku: varchar('sku', { length: 50 }),
  barcode: varchar('barcode', { length: 50 }),

  createdAt: timestamp('created_at', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }),
}, (table) => {
    return {
        productIdIdx: index('product_id_idx').on(table.productId) 
    }
})

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
    product: one(products, {
        fields: [productVariants.productId],
        references: [products.id]
    })
}))


export type ProductVariation = typeof productVariants.$inferInsert

