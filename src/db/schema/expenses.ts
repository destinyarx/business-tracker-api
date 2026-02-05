import { pgTable, serial, varchar, text, timestamp, decimal, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm'

export const expenseCategoryEnum = pgEnum('expense_category', [
    'rent',
    'utilities',
    'supplies',
    'inventory',
    'shipping',
    'marketing',
    'fees',
    'software',
    'salary',
    'maintenance',
    'equipment',
    'taxes',
    'professional_services',
    'transportation',
    'meals',
    'other',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
    'cash',
    'gcash',
    'maya',
    'other_e_wallet',
    'bank_transfer',
    'credit_card',
    'other',
]);

export const expenses = pgTable('expenses', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 150 }).notNull(),
    description: text('description'),
    amount: decimal('amount', { precision: 10, scale: 2 }).$type<number>().notNull(),
    dateIncurred: timestamp('date_incurred', { mode: 'date' }),
    referenceNumber: varchar('reference_number', { length: 80 }),
    category: expenseCategoryEnum('category').notNull(),
    categoryOther: varchar('category_other', { length: 50 }),
    paymentMethod: paymentMethodEnum('payment_method').default('cash'),
    paymentMethodOther: varchar('payment_other', { length: 50 }),

    createdBy: varchar('created_by', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedBy: varchar('updated_by', { length: 100 }),
    updatedAt: timestamp('updated_at', { mode: 'string' }),
    deletedAt: timestamp('deleted_at', { mode: 'date' })
}, (table) => ({
    createdByIdx: index('expenses_created_by_idx').on(table.createdBy)
}));

export type Expenses = typeof expenses.$inferInsert;
