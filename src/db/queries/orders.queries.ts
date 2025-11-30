import { db } from '../index';
import { eq, isNull, desc, and } from 'drizzle-orm';
import type { Order } from '../schema/orders'
import { orders } from '../schema/orders'
import { orderItems } from '../schema/order_items'
import { CreateOrderItemDto } from 'src/orders/dto/create-order-item-dto'

export async function addOrder(data: Order, userId: string) {
  return await db
    .insert(orders)
    .values({
      customerId: data.customerId,
      orderName: data.orderName,
      orderStatus: data.orderStatus,
      totalAmount: data.totalAmount,
      createdBy: userId
    })
    .returning({ id: orders.id })
}

export async function addOrderItems(id: number, items: CreateOrderItemDto[]) {
  await db.insert(orderItems).values(
    items.map((item) => {
      const priceAtPurchase = item.priceAtPurchase.toString()

      return {
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: priceAtPurchase,
        subtotal: (item.quantity * item.priceAtPurchase).toString(),
      }
    })
  );
}


export async function getOrders(userId: string) {
  return await db.query.orders.findMany({
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
  return await db.query.orders.findFirst({
    where: and(
      eq(orders.id, id),
      eq(orders.createdBy, userId),
      isNull(orders.deletedAt),
    ),
    orderBy: desc(orders.createdAt),
    with: {
      items: {
        with: {
          product: true
        }
      }, 
      customer: true
    }
  })
}

export async function updateOrder(id: number, data: Partial<Order>, userId: string) {
  return await db
    .update(orders)
    .set({
        ...data,
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