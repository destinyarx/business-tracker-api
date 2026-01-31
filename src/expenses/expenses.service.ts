import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { GetExpensePaginateDto } from './dto/get-expense-paginate-dto'
import { getExpensesPaginated, getExpenseById, createExpense, updateExpense, deleteExpense } from '../db/queries/expenses.queries'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class ExpensesService {
  async create(createExpenseDto: CreateExpenseDto, userId: string) {
    try {
      return await createExpense(createExpenseDto, userId);
    } catch (error) {
      console.log(error)
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async getPaginated(query: GetExpensePaginateDto, userId: string) {
    try {
      return await getExpensesPaginated(query, userId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number, userId: string) {
    try {
      return await getExpenseById(id, userId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto, userId: string) {
    try {
      return await updateExpense(id, updateExpenseDto, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      return await deleteExpense(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new BadRequestException(message);
    }
  }
}
