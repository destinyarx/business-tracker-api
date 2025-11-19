import { db } from '../index';
import { isNull, eq, or, ilike, and } from 'drizzle-orm';
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

export async function getProductsPaginated(
  limit: number,
  offset: number,
  searchTerm: string | null,
  filter: string | null,      
) {
  // const conditions = [];

  // if (searchTerm) {
  //   const term = `%${searchTerm}%`;
  //   conditions.push(
  //     or(
  //       ilike(products.name, term),
  //       ilike(products.sku, term),
  //       ilike(products.barcode, term),
  //     )
  //   );
  // }

  // if (filter) {
  //   conditions.push(ilike(products.category, `%${filter}%`));
  // }

  // // Compose the main query
  // let query = db
  //   .select()
  //   .from(products)
  //   .limit(limit)
  //   .offset(offset);

  // if (conditions.length > 0) {
  //   query = query.where(and(...conditions));
  // }

  // return await query;
}
