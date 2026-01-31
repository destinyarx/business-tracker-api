import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { getAllCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer, findCustomersPaginated } from '../db/queries/customers.queries'
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CustomerService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: string, createCustomerDto: CreateCustomerDto) {
    try {
      const insert = await addCustomer(userId, createCustomerDto);
      await this.cacheManager.del(`${userId}:/customers`)
      return insert
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async findAll(userId: string) {
    console.log('findAll')
    try {
      return await getAllCustomers(userId);
    } catch (error) {
      console.log(error)
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
	}

  async findOne(id: number) {
    console.log('findOne')
    try {
      return await getCustomer(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto, userId: string) {
    try {
      const update = await updateCustomer(id, updateCustomerDto);
      await this.cacheManager.del(`${userId}:/customers`)
      return update
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update customer';
      throw new BadRequestException(message);
    }
  }

  async remove(id: number, userId: string) {
    try {
      await deleteCustomer(id);
      await this.cacheManager.del(`${userId}:/customers`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete customer';
      throw new BadRequestException(message);
    }
  }

  async findPaginated(user: string, limit: number, offset: number) {
    console.log('findPaginated')
    try {
      return await findCustomersPaginated(user, limit, offset)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error occured';
      throw new BadRequestException(message);
    }
  }
}
