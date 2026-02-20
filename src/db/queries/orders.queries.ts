import { db } from '../index';
import { eq, isNull, desc, asc, and, inArray, sql, ilike, or, gte, lte } from 'drizzle-orm';
import { orders } from '../schema/orders'
import { products } from '../schema/products'
import { orderItems } from '../schema/order_items'
import { CreateOrderItemDto } from 'src/orders/dto/create-order-item-dto'
import { UpdateOrderStatusDto } from 'src/orders/dto/update-order-status-dto'
import { GetOrderDto } from 'src/orders/dto/get-order.dto'
import { ItemDto } from 'src/orders/dto/update-order-status-dto'
import type { Order } from '../schema/orders'
import type { Product } from '../schema/products'
import { getDateRangeFromPeriod, type TimePeriod } from '../../common/utils/date-range'


type Tx = Parameters<typeof db.transaction>[0] extends (tx: infer T) => any ? T : never;

type OrderItem = Product & {
  quantity: number
}

type OrderData = Order & {
  orderItems: OrderItem[],
}

export async function addOrder(userId: string, data: OrderData) {
  let profitInaccurate: boolean = false
  let totalProfit: number = 0

  data.orderItems.map((item) => {
    if (item.profit) {
      totalProfit += item.profit * item.quantity
    } else {
      profitInaccurate = true
    }
  })


  await db.transaction( async (tx) => {
    const insertedOrder = await tx
      .insert(orders)
      .values({
        customerId: data.customerId,
        orderName: data.orderName,
        status: 'pending',
        notes: data.notes,
        totalAmount: String(data.totalAmount),
        totalProfit: String(totalProfit),
        profitInaccurate: profitInaccurate,
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
        productId: item.id,
        quantity: item.quantity,
        priceAtPurchase: priceAtPurchase,
        subtotal: (item.quantity * item.price).toString(),
      }
    })
  );
}

export async function getOrdersPaginated(params: GetOrderDto, userId: string) {
  const range = params?.timePeriod ? getDateRangeFromPeriod(params.timePeriod as TimePeriod) : undefined
  const orderBy: any[] = [];

  orderBy.push(
    params?.sort === 'asc'
      ? asc(orders.createdAt)
      : desc(orders.createdAt)
  );

  if (params?.sortByStatus) {
    orderBy.push(
      params.sortByStatus === 'asc'
        ? asc(orders.statusUpdatedAt)
        : desc(orders.statusUpdatedAt)
    );
  }

  const result = await db.query.orders.findMany({
    where: and(
      eq(orders.createdBy, userId),
      isNull(orders.deletedAt),

      params?.searchKey ? or(
        ilike(orders.orderName, `%${params.searchKey}%`),
        ilike(orders.notes, `%${params.searchKey}%`)
      ) : undefined,

      params?.filter && params.filter !== 'all'
        ? eq(orders.status, params.filter) 
        : undefined,

      params?.timePeriod ? and (
          gte(orders.createdAt, range!.start),
          lte(orders.createdAt, range!.end)
        ) : undefined
    ),
    orderBy: orderBy,
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
              id: true,
              title: true,
              price: true,
              profit: true,
            }
          },
        },
      },
      customer: {
        columns: { name: true }
      }, 
    },
    limit: params.limit ? params.limit + 1 : undefined,
    offset: params.offset ?? undefined
  })

  let hasNext = false
  if (params.limit && result?.length > params.limit) {
    hasNext = true
    result.pop()
  }

  return {
    orders: result,
    hasNext: hasNext
  }
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
        updatedAt: new Date(),
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

export async function updateOrderStatus(id: number, data: UpdateOrderStatusDto, userId: string): Promise<boolean> {
  return await db.transaction(async (tx) => {
    await updateStatus(tx, id, data.status, userId)

    if (data.status === 'in_progress') {
      return await updateProductQuantity(tx, data.orderItems, 'deduct')
    } else {
      return await updateProductQuantity(tx, data.orderItems, 'revert')
    }
  })
}

async function updateStatus(tx: Tx, id: number, status: string, userId: string) {
  try {
    return await tx
    .update(orders)
    .set({
        status: status,
        statusUpdatedAt: new Date(),
        updatedBy: userId
    })
    .where(eq(orders.id, id))
    .returning({ id: orders.id })
  } catch (error) {
    console.log(error)
    throw new Error("Error updating status")
  }
}

async function updateProductQuantity(tx: Tx, orderItems: ItemDto[], mode: 'deduct' | 'revert') {
  const ids = orderItems.map(item => item.product.id)

  const currentProducts = await tx
    .select({ id: products.id, stock: products.stock })
    .from(products)
    .where(inArray(products.id, ids))

  const stockById = new Map(currentProducts.map(item => [item.id, item.stock]))
  const updatedStock: Record<number, number> = {};

  for (const item of orderItems) {
    const stock = stockById.get(item.product.id) ?? 0
    
    if (item.quantity > stock) return false

    if (mode === 'deduct') {
      updatedStock[item.product.id] = stock - item.quantity
    } else {
      updatedStock[item.product.id] = stock + item.quantity
    }
  }

  const caseExpr = sql`CASE ${products.id} ${sql.join(
    orderItems.map(i => sql`WHEN ${i.product.id} THEN ${updatedStock[i.product.id]}`),
    sql` `
  )} ELSE ${products.stock} END`;

  await tx
    .update(products)
    .set({ stock: caseExpr })
    .where(inArray(products.id, ids))
    .returning({ id: products.id, stock: products.stock })

  return true
}