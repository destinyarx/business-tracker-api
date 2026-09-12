import { Transform, type TransformFnParams } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ORDER_STATUS, type OrderStatus } from './create-order.dto';

export class UpdateOrderStatusDto {
	@IsIn(ORDER_STATUS)
	status: OrderStatus;

	@IsOptional()
	@Transform(({ value }: TransformFnParams): unknown =>
		typeof value === 'string' ? value.trim() : value,
	)
	@IsString()
	@MaxLength(500)
	reversalReason?: string;
}
