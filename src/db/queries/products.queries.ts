import { db } from '../index';
import { eq, desc, or, ilike, and } from 'drizzle-orm';
import type { Product } from '../schema/products'
import { products } from '../schema/products'

export async function getAllProducts(userId, searchTerm?: string, filter?: string) {
  return await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.createdBy, userId),
        filter ? eq(products.category, filter) : undefined,

        searchTerm ? 
          or(
            ilike(products.title, `%${searchTerm}%`),
            ilike(products.category, `%${searchTerm}%`),
            ilike(products.sku, `%${searchTerm}%`),
            ilike(products.supplier, `%${searchTerm}%`),
          )
        : undefined
      )
    )
    .orderBy(desc(products.createdAt))
};

export async function getProduct(id: number) {
    return await db
      .select()
      .from(products)
      .where(eq(products.id, id));
}

export async function addProduct(productData: Product, userId: string) {
  delete productData.id
  
  const [product] = await db
    .insert(products)
    .values({
      ...productData,
      createdBy: userId
    })
    .returning({ id: products.id });
  
  return product?.id ?? false;
};

export async function updateProduct(id: number, data: Partial<Product>, userId: string) { 
    return await db
        .update(products)
        .set({
          ...data,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(products.id, id))
        .returning({ id: products.id });
}

export async function deleteProduct(id: number) {
    return await db
        .delete(products)
        .where(eq(products.id, id))
        .returning({ id: products.id });
}

export async function getProductsPaginated(
  limit: number,
  offset: number,
  searchTerm: string | null,
  filter: string | null,      
) {
  return await db
    .select()
    .from(products)
    .where(
      and(
        filter ? eq(products.category, filter) : undefined,

        searchTerm ? 
        or(
          ilike(products.title, `%${searchTerm}%`),
          ilike(products.category, `%${searchTerm}%`),
          ilike(products.sku, `%${searchTerm}%`),
          ilike(products.supplier, `%${searchTerm}%`),
        )
        : undefined
      )
    )
    .limit(limit)
    .offset(offset)
}
