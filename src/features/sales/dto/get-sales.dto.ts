import { IsIn, IsOptional, IsString } from 'class-validator';

export const SALES_RANGES = [
	'today',
	'yesterday',
	'this_week',
	'this_month',
] as const;
export const SALE_STATES = ['active', 'reverted', 'all'] as const;
export const SALES_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type SalesRange = (typeof SALES_RANGES)[number];
export type SaleStateFilter = (typeof SALE_STATES)[number];
export type SalesSortDirection = (typeof SALES_SORT_DIRECTIONS)[number];

export class GetSalesDto {
	@IsOptional()
	@IsIn(SALES_RANGES)
	range?: SalesRange;

	@IsOptional()
	@IsIn(SALE_STATES)
	state?: SaleStateFilter;

	@IsOptional()
	@IsIn(SALES_SORT_DIRECTIONS)
	sort?: SalesSortDirection;

	@IsOptional()
	@IsString()
	search?: string;
}
