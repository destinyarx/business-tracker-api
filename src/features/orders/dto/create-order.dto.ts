import {
	IsIn,
	IsString,
	IsNumber,
	IsOptional,
	IsArray,
	ValidateNested,
	MaxLength,
} from 'class-validator';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item-dto';

export const ORDER_STATUS = [
	'pending',
	'in_progress',
	'completed',
	'failed',
	'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export class CreateOrderDto {
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	customerId?: number;

	@IsOptional()
	@Transform(({ value }: TransformFnParams): unknown =>
		typeof value === 'string' ? value.trim() : value,
	)
	@IsString()
	@MaxLength(50)
	orderName?: string;

	@IsOptional()
	@Transform(({ value }: TransformFnParams): unknown =>
		typeof value === 'string' ? value.trim() : value,
	)
	@IsString()
	@MaxLength(500)
	notes?: string;

	@IsIn(ORDER_STATUS, { message: 'Status not valid' })
	status: OrderStatus;

	@IsString()
	totalAmount: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateOrderItemDto)
	orderItems: CreateOrderItemDto[];
}
