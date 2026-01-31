import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { addOrder, getOrders, getOrderById, updateOrder, deleteOrder, updateOrderStatus } from 'src/db/queries/orders.queries'

@Injectable()
export class OrdersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    try {
      const order = await addOrder(userId, createOrderDto);

      await this.cacheManager.del(`${userId}:/orders`)
      return order
    } catch (error) {
      console.log(error)
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
      const response = await updateOrder(id, updateOrderDto, userId)
      await this.cacheManager.del(`${userId}:/orders`)
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async remove(id: number, userId: string) {
    try {
      const response = await deleteOrder(id)
      await this.cacheManager.del(`${userId}:/orders`)
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }

  async updateOrderStatus(id: number, status: string, userId: string) {
    try {
      const response = await updateOrderStatus(id, status, userId)
      await this.cacheManager.del(`${userId}:/orders`)
      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occurs';
      throw new BadRequestException(message);
    }
  }
}
