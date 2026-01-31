import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseInterceptors } from '@nestjs/common';
import { UserCacheInterceptor } from '../common/interceptors/user-cache.interceptor'
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UserId } from '../common/decorators/user-id.decorator'

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@UserId() userId: string, @Body() createCustomerDto: CreateCustomerDto) {
    console.log(createCustomerDto)
    return this.customerService.create(userId, createCustomerDto);
  }

  @Get()
  @UseInterceptors(UserCacheInterceptor)
  findAll(@UserId() userId: string) {
    console.log(userId)
    return this.customerService.findAll(userId);
  }

  @Get('paginated')
  findPaginated(
    @Query('user') user: string,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('offset', ParseIntPipe) offset: number,
  ) {
    return this.customerService.findPaginated(user, limit, offset);
  }

  @Get(':id')
  @UseInterceptors(UserCacheInterceptor)
  findOne(@Param('id') id: number) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  update(@UserId() userId: string, @Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(+id, updateCustomerDto, userId);
  }

  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.customerService.remove(+id, userId);
  }
}
