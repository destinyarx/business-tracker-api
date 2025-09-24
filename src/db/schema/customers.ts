import { pgTable,  timestamp, varchar, serial } from "drizzle-orm/pg-core"
import { sql } from 'drizzle-orm';

export const customers = pgTable('customers', {
    id: serial('id').primaryKey().notNull(),
    alias: varchar("alias", { length: 50 }),
    firstName: varchar("first_name", { length: 50 }),
    middleName: varchar('middle_name', { length: 50 }),
    lastName: varchar('last_name', { length: 50 }),
    email: varchar({ length: 50 }),
    gender: varchar({ length: 10 }).notNull(),
    contactNumber: varchar('contact_number', { length: 20 }),
    status: varchar({ length: 30 }),

    // createdBy: varchar("supabase_id", { length: 100 }).references(() => users.id),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export type CustomerColumn = typeof customers.$inferInsert;