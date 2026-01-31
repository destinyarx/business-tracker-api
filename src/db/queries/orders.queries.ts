import { db } from '../index';
import { eq, isNull, desc, asc, and } from 'drizzle-orm';
import { orders } from '../schema/orders'
import { orderItems } from '../schema/order_items'
import { CreateOrderItemDto } from 'src/orders/dto/create-order-item-dto'
import type { Order } from '../schema/orders'
import type { Product } from '../schema/products'

type OrderItem = Product & {
  quantity: number
}

type OrderData = Order & {
  orderItems: OrderItem[],
}

export async function addOrder(userId: string, data: OrderData) {
  await db.transaction( async (tx) => {
    const insertedOrder = await tx
      .insert(orders)
      .values({
        customerId: data.customerId,
        orderName: data.orderName,
        status: 'pending',
        notes: data.notes,
        totalAmount: String(data.totalAmount),
        createdBy: userId
      })
      .returning({ id: orders.id})

    const items = data.orderItems.map((item) => ({
      orderId: insertedOrder[0].id,
      productId: item.id,
      priceAtPurchase: item.price.toFixed(2),
      quantity: item.quantity,
      subtotal: (Number(item.price) * Number(item.quantity)).toFixed(2)
    }))

    await tx.insert(orderItems).values(items)
      
    return insertedOrder
  })
}

export async function addOrderItems(id: number, items: CreateOrderItemDto[]) {
  await db.insert(orderItems).values(
    items.map((item) => {
      const priceAtPurchase = item.price.toString()

      return {
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: priceAtPurchase,
        subtotal: (item.quantity * item.price).toString(),
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
    orderBy: asc(orders.createdAt),
    with: {
      items: {
        columns: {
          quantity: true,
          priceAtPurchase: true,
          subtotal:  true
        },
        with: {
          product: {
            columns: {
              title: true,
              price: true
            }
          },
        },
      },
      customer: {
        columns: { name: true }
      }, 
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

export async function updateOrderStatus(id: number, status: string, userId: string) {
  return await db
    .update(orders)
    .set({
        status: status,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    })
    .where(eq(orders.id, id))
    .returning({ id: orders.id })
}