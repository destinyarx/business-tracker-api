import { isNull, eq } from 'drizzle-orm';
import { db } from '../index';
import type { Customer } from '../schema/customers';
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

export async function addCustomer(customerData: Customer) {
    return await db
        .insert(customers)
        .values(customerData)
        .returning({ insertedId: customers.id });
};

export async function updateCustomer(id: number, data: Partial<Customer>) {    
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

export async function findCustomersPaginated(limit: number, offset: number) 
{
    return await db
        .select()
        .from(customers)
        .limit(limit)
        .offset(offset);
}