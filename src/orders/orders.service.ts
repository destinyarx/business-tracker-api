import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { addOrder, addOrderItems, getOrders, getOrderById, updateOrder, deleteOrder } from 'src/db/queries/orders.queries'

@Injectable()
export class OrdersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    try {
      const order = await addOrder(createOrderDto, userId);
      const orderId = order[0].id
      await addOrderItems(orderId, createOrderDto.orderItems)

      await this.cacheManager.del(`${userId}:/products`)
      return orderId
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async findAll(userId: string) {
    try {
      return await getOrders(userId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number, userId: string) {
    try {
      return await getOrderById(id, userId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async update(id: number, userId: string, updateOrderDto: UpdateOrderDto) {
    try {
      return await updateOrder(id, updateOrderDto, userId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      return await deleteOrder(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }
}
