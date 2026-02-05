import { db } from '../index';
import { eq, desc, and, or, ilike, gte, lte } from 'drizzle-orm';
import { expenses } from '../schema/expenses'
import { CreateExpenseDto } from '../../expenses/dto/create-expense.dto' 
import { UpdateExpenseDto } from '../../expenses/dto/update-expense.dto' 
import { GetExpensePaginateDto } from '../../expenses/dto/get-expense-paginate-dto' 
import { getDateRangeFromPeriod, type TimePeriod } from '../../common/utils/date-range'

export async function getExpensesPaginated(query: GetExpensePaginateDto, userId: string) {
    const { limit, offset, searchKey, category, paymentMethod, timePeriod } = query
    let hasNext = false

    const range = timePeriod ? getDateRangeFromPeriod(timePeriod as TimePeriod) : undefined
    
    const results = await db 
        .select()
        .from(expenses)
        .where(
            and(
                eq(expenses.createdBy, userId),
                category ? eq(expenses.category, category) : undefined,
                paymentMethod ? eq(expenses.paymentMethod, paymentMethod) : undefined,

                searchKey ? or (
                    ilike(expenses.title, `%${searchKey}%`),
                    ilike(expenses.description, `%${searchKey}%`)
                ) : undefined,


                timePeriod ? and (
                    gte(expenses.dateIncurred, range!.start),
                    lte(expenses.dateIncurred, range!.end)
                ) : undefined
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

    return await db
        .insert(expenses)
        .values({
            ...rest,
            amount: parsedAmount,
            dateIncurred: dateIncurred ? new Date(dateIncurred) : null,
            createdBy: userId
        }).returning(
            { insertedId: expenses.id }
        )
}

export async function updateExpense(id: number, data: UpdateExpenseDto, userId: string) {
    const { amount, dateIncurred, ...rest } = data
    const parsedAmount = Number(amount)

    return await db
        .update(expenses)
        .set({
            ...rest,
            amount: parsedAmount,
            dateIncurred: dateIncurred ? new Date(dateIncurred) : null,
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
