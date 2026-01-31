import { db } from '../index';
import { eq, desc, and } from 'drizzle-orm';
import { expenses } from '../schema/expenses'
import { CreateExpenseDto } from '../../expenses/dto/create-expense.dto' 
import { UpdateExpenseDto } from '../../expenses/dto/update-expense.dto' 
import { GetExpensePaginateDto } from '../../expenses/dto/get-expense-paginate-dto' 

export async function getExpensesPaginated(query: GetExpensePaginateDto, userId: string) {
    const { limit, offset, category, filter } = query
    let hasNext = false

    const results = await db 
        .select()
        .from(expenses)
        .where(
            and(
                eq(expenses.createdBy, userId),
                category ? eq(expenses.category, category) : undefined,
                filter ? eq(expenses.paymentMethod, filter) : undefined
            )
        )
        .orderBy(desc(expenses.createdAt))
        .limit(limit + 1)
        .offset(offset)

    if (results.length === (limit + 1)) {
        hasNext = true
        results.pop()
    }
      
    return {
        results: results,
        hasNext: hasNext
    }
}

export async function getExpenseById(id: number, userId: string) {
    const data = await db
        .select()
        .from(expenses)
        .where(eq(expenses.createdBy, userId))
        .limit(1)

    if (data.length) return data[0]

    return null
}

export async function createExpense(data: CreateExpenseDto, userId: string) {
    const { amount, dateIncurred, ...rest } = data

    const parsedAmount = Number(amount)
    const dateString = new Date(dateIncurred)?.toISOString() ?? dateIncurred

    return await db
        .insert(expenses)
        .values({
            ...rest,
            amount: parsedAmount,
            dateIncurred: dateString,
            createdBy: userId
        }).returning(
            { insertedId: expenses.id }
        )
}

export async function updateExpense(id: number, data: UpdateExpenseDto, userId: string) {
    const { amount, dateIncurred, ...rest } = data

    const parsedAmount = Number(amount)
    const dateString = dateIncurred? new Date(dateIncurred)?.toISOString() :  new Date().toISOString()

    return await db
        .update(expenses)
        .set({
            ...rest,
            amount: parsedAmount,
            dateIncurred: dateString,
            updatedBy: userId,
            updatedAt: new Date().toISOString() 
        })
        .where(and(
            eq(expenses.id, id),
            eq(expenses.createdBy, userId)
        ))
        .returning({ id: expenses.id })
}

export async function deleteExpense(id: number) {
    return await db
        .delete(expenses)
        .where(eq(expenses.id, id))
        .returning({ id: expenses.id })
}
