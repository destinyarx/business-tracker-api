import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { GetExpensePaginateDto } from './dto/get-expense-paginate-dto'
import { UserId } from '../common/decorators/user-id.decorator'
 

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@UserId() userId: string, @Body() createExpenseDto: CreateExpenseDto) {
    console.log(createExpenseDto)
    return this.expensesService.create(createExpenseDto, userId);
  }

  @Get('/paginated')
  findPaginated(@UserId() userId: string, @Query() query: GetExpensePaginateDto) {
    return this.expensesService.getPaginated(query, userId)
  }

  @Get(':id')
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.expensesService.findOne(+id, userId);
  }

  @Patch(':id')
  update(@UserId() userId: string, @Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(+id, updateExpenseDto, userId);
  }

  @Delete(':id')
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.expensesService.remove(+id);
  }
}
