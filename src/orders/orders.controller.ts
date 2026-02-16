import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status-dto';
import { GetOrderDto } from './dto/get-order.dto'
import { UserId } from '../common/decorators/user-id.decorator'
import { UserCacheInterceptor } from '../common/interceptors/user-cache.interceptor'


@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@UserId() userId: string, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(userId, createOrderDto)
  }

  @Get()
  // @UseInterceptors(UserCacheInterceptor)
  findAll(@UserId() userId: string, @Query() query: GetOrderDto) {
    console.log(query)
    return this.ordersService.findAll(query, userId)
  }

  @Get(':id')
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.ordersService.findOne(+id, userId)
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @UserId() userId: string, 
    @Param('id') id: string, 
    @Body() data: UpdateOrderStatusDto
  ) {
    console.log(data)
    return await this.ordersService.updateOrderStatus(+id, data, userId)
  }

  @Patch(':id')
  update(
    @UserId() userId: string, 
    @Param('id') id: string, 
    @Body() updateOrderDto: UpdateOrderDto
  ) {
    return this.ordersService.update(+id, userId, updateOrderDto)
  }

  @Delete(':id')
  @UseInterceptors(UserCacheInterceptor)
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.ordersService.remove(+id, userId)
  }
}
