import { pgTable,  timestamp, varchar, serial } from "drizzle-orm/pg-core"
import { sql, relations } from 'drizzle-orm';
import { users } from '../schema/users'

export const customers = pgTable('customers', {
    id: serial('id').primaryKey().notNull(),
    alias: varchar("alias", { length: 50 }),
    fullName: varchar("full_name", { length: 50 }),
    email: varchar({ length: 50 }),
    gender: varchar({ length: 10 }).notNull(),
    contactNumber: varchar('contact_number', { length: 20 }),
    status: varchar({ length: 30 }),
    
    createdBy: varchar('created_by', { length: 100 }).references(() => users.clerkId),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'string' }),
});

export const customersRelations = relations(customers, ({ one }) => ({
    user: one(users, {
        fields: [customers.createdBy],
        references: [users.clerkId],
    }),
}));

export type Customer = typeof customers.$inferInsert;