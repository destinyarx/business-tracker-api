import { Type } from 'class-transformer'
import { IsString, IsOptional, IsInt, Min, IsIn } from 'class-validator'
import { paymentMethodEnum, expenseCategoryEnum } from '../../db/schema/expenses'

type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number]
type CategoryList = (typeof expenseCategoryEnum.enumValues)[number]

export class GetExpensePaginateDto {
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset = 0

    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit = 10


    @IsOptional()
    @IsIn(paymentMethodEnum.enumValues, {
        message: 'Payment method filter is not valid'
    })
    filter?: PaymentMethod

    @IsOptional()
    @IsIn(expenseCategoryEnum.enumValues, {
        message: 'Category is not valid'
    })
    category?: CategoryList
}