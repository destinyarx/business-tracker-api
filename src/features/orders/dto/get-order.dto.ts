import { IsIn, IsInt, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export const ORDER_DATE_RANGES = [
	'all',
	'today',
	'yesterday',
	'this_week',
] as const;
export const ORDER_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type OrderDateRange = (typeof ORDER_DATE_RANGES)[number];
export type OrderSortDirection = (typeof ORDER_SORT_DIRECTIONS)[number];

export class GetOrderDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	offset?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	limit?: number;

	@IsOptional()
	@IsString()
	filter?: string;

	@IsOptional()
	@IsString()
	searchKey?: string;

	@IsOptional()
	@IsIn(ORDER_DATE_RANGES)
	timePeriod?: OrderDateRange;

	@IsOptional()
	@IsIn(ORDER_SORT_DIRECTIONS)
	sort?: OrderSortDirection;

	@IsOptional()
	@IsString()
	sortByStatus?: string;
}
