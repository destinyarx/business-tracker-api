import { isNull, eq } from 'drizzle-orm';
import { db } from '../index';
import type { CustomerColumn } from '../schema/customers';
import { customers } from '../schema/customers';

export async function getAllCustomers() {
    return await db
      .select()
      .from(customers)
      .where(isNull(customers.deletedAt));
};

export async function getCustomer(id: number) {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
}

export async function addCustomer(customerData: CustomerColumn) {
    return await db
        .insert(customers)
        .values(customerData)
        .returning({ insertedId: customers.id });
};

export async function updateCustomer(id: number, data: Partial<CustomerColumn>) {
    return await db
        .update(customers)
        .set(data)
        .where(eq(customers.id, id))
        .returning();
}

export async function deleteCustomer(id: number) {
    return await db
        .delete(customers)
        .where(eq(customers.id, id))
        .returning();
}

export async function findCustomersPaginated(limit: number, offset: number, user: number) 
{
    console.log('limit: ')
    console.log(limit)
    console.log('offset: ')
    console.log(typeof offset)

    return await db
        .select()
        .from(customers)
        .limit(limit)
        .offset(offset);
}