import { pgTable, serial, integer, numeric, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm';
import { products } from '../schema/products'
import { orders } from '../schema/orders'

export const orderItems = pgTable('order_items',  {
    id: serial('id').primaryKey().notNull(),
    orderId: integer('order_id').references(() => orders.id, {
        onDelete: 'set null'
    }),
    productId: integer('product_id').references(() => products.id, {
        onDelete: 'set null'
    }),
    quantity: integer('quantity').notNull(),
    priceAtPurchase: numeric('price_at_purchase', { precision: 12, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
}, (table) => {
    return {
        orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
        productIdIdx: index('order_items_product_id_idx').on(table.productId)
    }
})

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id]
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id]
    })
}))

export type OrderItem = typeof orderItems.$inferInsert