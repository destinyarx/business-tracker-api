import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { getAllCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer, findCustomersPaginated } from '../db/queries/customers.queries'

@Injectable()
export class CustomerService {
  async create(createCustomerDto: CreateCustomerDto) {
    try {
      return await addCustomer(createCustomerDto);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async findAll() {
    try {
      return await getAllCustomers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
	}

  async findOne(id: number) {
    try {
      return await getCustomer(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const data = Object.fromEntries(
      Object.entries(updateCustomerDto).filter(([_, value]) => value !== undefined),
    );

    try {
      return await updateCustomer(id, data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      return await deleteCustomer(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async findPaginated(limit: number, offset: number) {
    try {
      return await findCustomersPaginated(limit, offset)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }
}
