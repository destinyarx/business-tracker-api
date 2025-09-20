import { isNull } from 'drizzle-orm';
import { db } from '../index';
import type { CustomerColumn } from '../schema/customers';
import { customers } from '../schema/customers';

export async function getAllCustomers() {
    return db
      .select()
      .from(customers)
      .where(isNull(customers.deletedAt));
};

export async function addCustomer(customerData: CustomerColumn) {
    return await db
        .insert(customers)
        .values(customerData)
        .returning({ insertedId: customers.id });
};