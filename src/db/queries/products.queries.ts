import { db } from '../index';
import { isNull, eq } from 'drizzle-orm';
import type { Product } from '../schema/products'
import { products } from '../schema/products'

export async function getAllProducts() {
    return await db
      .select()
      .from(products)
      .where(isNull(products.deletedAt));
};

export async function getProduct(id: number) {
    return await db
      .select()
      .from(products)
      .where(eq(products.id, id));
}

export async function addProduct(productData: Product) {
    return await db
        .insert(products)
        .values(productData)
        .returning({ insertedId: products.id });
};

export async function updateProduct(id: number, data: Partial<Product>) {    
    return await db
        .update(products)
        .set(data)
        .where(eq(products.id, id))
        .returning();
}

export async function deleteProduct(id: number) {
    return await db
        .delete(products)
        .where(eq(products.id, id))
        .returning();
}

export async function getProductsPaginated(limit: number, offset: number) 
{
    return await db
        .select()
        .from(products)
        .limit(limit)
        .offset(offset);
}