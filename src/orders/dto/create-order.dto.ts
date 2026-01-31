import { IsIn, IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CreateOrderItemDto } from './create-order-item-dto'

export const ORDER_STATUS = [
  'pending',
  'in_progress',
  'success',
  'failed',
  'cancelled'
] as const

export class CreateOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsString()
  orderName?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsIn(ORDER_STATUS, { message: 'Status not valid' })
  status: (typeof ORDER_STATUS)[number]

  @IsString()
  totalAmount: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[]
}
