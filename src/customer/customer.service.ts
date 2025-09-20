import { Injectable } from '@nestjs/common';
import type { CustomerColumn } from '../db/schema/customers'
import { getAllCustomers } from '../db/queries/customers.queries'

@Injectable()
export class CustomerService {
	async findAll() {
		return await getAllCustomers();
	}

	create(customerData: Partial<CustomerColumn>) {
		return {
			message: 'successful',
			data: customerData,
		};
	}
}
