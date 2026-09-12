import { Transform, Type, type TransformFnParams } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderDto {
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	customerId?: number | null;

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
}
