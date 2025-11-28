import { db } from '../index';
import { eq, isNull, desc, and } from 'drizzle-orm';
import type { Order } from '../schema/orders'
import { orders } from '../schema/orders'

export async function getOrders(userId: string) {
    return await db.query.orders.findMany(
        {
        where: and(
          eq(orders.createdBy, userId),
          isNull(orders.deletedAt)
        ),
        orderBy: desc(orders.createdAt),
        with: {
          items: {
            with: {
              product: true,
            },
          },
          customer: true, 
        },
    })
}

export async function getOrderById(id: number, userId: string) {
    return await db
        .select()
        .from(orders)
        .where(and(
            eq(orders.id, id),
            isNull(orders.deletedAt)
        ))
}

export async function addOrder(data: Order) {
    return await db
        .insert(orders)
        .values(data)
        .returning({ id: orders.id })
}

export async function updateOrder(id: number, data: Partial<Order>, userId: string) {
    return await db
        .update(orders)
        .set({
            ...orders,
            updatedAt: new Date().toISOString(),
            updatedBy: userId
        })
        .where(eq(orders.id, id))
        .returning({ id: orders.id })
}

export async function deleteOrder(id: number) {
    return await db
        .delete(orders)
        .where(eq(orders.id, id))
        .returning({ id: orders.id })
}