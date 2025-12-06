import { isNull, eq, and } from 'drizzle-orm';
import { db } from '../index';
import type { Customer } from '../schema/customers';
import { customers } from '../schema/customers';

export async function getAllCustomers(userId: string) {
    return await db
        .select()
        .from(customers)
        .where(
            and(
                isNull(customers.deletedAt),
                eq(customers.createdBy, userId)
            )
        );
};

export async function getCustomer(id: number) {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
}

export async function addCustomer(userId: string, customerData: Customer) {
    return await db
        .insert(customers)
        .values({
            ...customerData,
            createdBy: userId
        })
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

export async function findCustomersPaginated(user: string, limit: number, offset: number) 
{
    let hasNext = false

    const results = await db
        .select()
        .from(customers)
        .where(eq(customers.createdBy, user))
        .limit(limit+1)
        .offset(offset);

    if (results.length > limit) hasNext = true

    results.pop()

    return {
        results,
        hasNext
    }
}