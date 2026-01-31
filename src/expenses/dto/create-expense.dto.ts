import { IsIn, IsOptional, IsNumberString, IsString, IsISO8601 } from 'class-validator';
import { paymentMethodEnum, expenseCategoryEnum } from '../../db/schema/expenses'

type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number]
type CategoryList = (typeof expenseCategoryEnum.enumValues)[number]

export class CreateExpenseDto {
    @IsString()
    title: string

    @IsOptional()
    @IsString()
    description: string

    @IsISO8601()
    dateIncurred: string
  
    @IsNumberString()
    amount: string

    @IsOptional()
    @IsString()
    referenceNumber: string

    @IsIn(expenseCategoryEnum.enumValues, { 
        message: 'Category is not valid.' 
    })
    category: CategoryList

    @IsOptional()
    @IsString()
    categoryOther: string

    @IsIn(paymentMethodEnum.enumValues, {
        message: 'Payment method value is not valid',
    })
    paymentMethod: PaymentMethod

    @IsOptional()
    @IsString()
    paymentMethodOther: string
}
