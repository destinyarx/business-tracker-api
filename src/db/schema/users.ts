import { pgTable,  timestamp, varchar, serial } from "drizzle-orm/pg-core"
import { relations, sql } from 'drizzle-orm';
import { customers } from './customers'

export const users = pgTable('users', {
    id: serial('id').primaryKey().notNull(),
    clerkId: varchar('clerk_id', { length: 50 }).unique().notNull(),
    username: varchar({ length: 50 }),
    email: varchar({ length: 50 }),
    name: varchar('full_name', { length: 50 }).notNull(),
    contactNumber: varchar('contact_number', { length: 20 }),
    status: varchar({ length: 30 }),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export const usersRelations = relations(users, ({ many }) => ({
    customers: many(customers),
}));

export type User = typeof users.$inferInsert;