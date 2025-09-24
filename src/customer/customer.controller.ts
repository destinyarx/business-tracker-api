import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  findAll() {
    return this.customerService.findAll();
  }

  @Get('paginated')
  findPaginated(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('offset', ParseIntPipe) offset: number,
    @Query('user', ParseIntPipe) user: number,
  ) {
    return this.customerService.findPaginated(limit, offset, user);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(+id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerService.remove(+id);
  }
}
