import { IsEnum, IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CreateOrderItemDto } from './create-order-item-dto'

export const ORDER_STATUS = [
  'pending',
  'in_progress',
  'success',
  'failed',
  'reverted'
] as const

export class CreateOrderDto {
  @IsOptional()
  @IsNumber()
  customerId: number

  @IsOptional()
  @IsString()
  orderName: string

  @IsEnum(ORDER_STATUS, {
    message: 'Status not valid',
  })
  status: typeof ORDER_STATUS[number]

  @IsNumber()
  totalAmount: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[]
}
