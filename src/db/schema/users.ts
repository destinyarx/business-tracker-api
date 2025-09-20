import { pgTable,  timestamp, varchar, serial } from "drizzle-orm/pg-core"
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
    id: serial('id').primaryKey().notNull(),
    username: varchar({ length: 50 }),
    email: varchar({ length: 50 }),
    // storeId: varchar("store_id", { length: 100 }).references(() => stores.id),
    firstName: varchar("first_name", { length: 50 }),
    middleName: varchar('middle_name', { length: 50 }),
    lastName: varchar('last_name', { length: 50 }),
    contactNumber: varchar('contact_number', { length: 20 }),
    status: varchar({ length: 30 }),

    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export type UserColumn = typeof users.$inferInsert;