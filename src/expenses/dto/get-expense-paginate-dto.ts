import { Type } from 'class-transformer'
import { IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator'
import { paymentMethodEnum, expenseCategoryEnum } from '../../db/schema/expenses'

type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number]
type CategoryList = (typeof expenseCategoryEnum.enumValues)[number]

const TIME_PERIOD = [ 'today', 'yesterday', 'week', 'last_week', 'month' ] as const

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
    @IsString()
    searchKey?: string

    @IsOptional()
    @IsIn(expenseCategoryEnum.enumValues, { message: 'Category is not valid' })
    category?: CategoryList

    @IsOptional()
    @IsIn(paymentMethodEnum.enumValues, { message: 'Payment method filter is not valid' })
    paymentMethod?: PaymentMethod

    @IsOptional()
    @IsIn(TIME_PERIOD, { message: 'Period filter is not valid'})
    timePeriod?: (typeof TIME_PERIOD)[number]
}