import { isNull, eq } from 'drizzle-orm';
import { db } from '../index';
import type { User } from '../schema/users';
import { users } from '../schema/users';

export async function getAll() {
    return await db
      .select()
      .from(users)
      .where(isNull(users.deletedAt));
};

export async function getUser(id: string) {
    return await db
      .select()
      .from(users)
      .where(eq(users.clerkId, id));
}

export async function addUser(userData: User) {
    return await db
        .insert(users)
        .values(userData)
        .returning({ insertedId: users.id });
};

export async function updateUser(id: string, data: Partial<User>) {
    return await db
        .update(users)
        .set(data)
        .where(eq(users.clerkId, id))
        .returning();
}

export async function deleteUser(id: string) {
    return await db
        .delete(users)
        .where(eq(users.clerkId, id))
        .returning();
}

export async function findUsersPaginated(limit: number, offset: number) 
{
    return await db
        .select()
        .from(users)
        .limit(limit)
        .offset(offset);
}