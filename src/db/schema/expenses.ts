import { pgTable, serial, varchar, text, integer, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../schema/users'

// Enum for expense categories
export const expenseCategoryEnum = pgEnum('expense_category', [
    'rent',
    'utilities',
    'supplies',
    'marketing',
    'salary',
    'maintenance',
    'other',
]);

// Enum for payment methods
export const paymentMethodEnum = pgEnum('payment_method', [
    'cash',
    'e_wallet',
    'bank_transfer',
    'credit_card',
    'check',
    'other',
]);

export const expenses = pgTable('expenses', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 150 }).notNull(),
    description: text('description'),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    category: expenseCategoryEnum('category').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').default('cash'),

    createdBy: varchar('created_by', { length: 100 }).references(() => users.clerkId),
    dateIncurred: timestamp('date_incurred').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export type Expenses = typeof expenses.$inferInsert;
