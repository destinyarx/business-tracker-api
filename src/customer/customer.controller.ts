import { Controller, Get, Post, Body } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  findAll(): object {
    return this.customerService.findAll();
  }

  @Post()
  create(@Body() customerData: any) {
    return this.customerService.create(customerData)
  }
}
