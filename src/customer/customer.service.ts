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
      throw new BadRequestException(error?.message || 'Failed to fetch customers');
    }
  }

  async findAll() {
    try {
      return await getAllCustomers();
    } catch (error) {
      throw new BadRequestException(error?.message || 'Failed to add customer');
    }
	}

  async findOne(id: number) {
    try {
      return await getCustomer(id);
    } catch (error) {
      throw new BadRequestException(error?.message || 'Customer does not exist');
    }
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const data = Object.fromEntries(
      Object.entries(updateCustomerDto).filter(([_, value]) => value !== undefined),
    );

    try {
      return await updateCustomer(id, data);
    } catch (error) {
      throw new BadRequestException(error?.message || 'Unexpected error occurs.');
    }
  }

  async remove(id: number) {
    try {
      return await deleteCustomer(id);
    } catch (error) {
      throw new BadRequestException(error?.message || 'Customer does not exist.');
    }
  }

  async findPaginated(limit: number, offset: number, user: number) {
    console.log(limit, offset, user)
    try {
      return await findCustomersPaginated(limit, offset, user)
    } catch (error) {
      throw new BadRequestException(error?.message || 'Customer does not exist.');
    }
  }
}
