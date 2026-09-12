import { IsIn, IsOptional } from 'class-validator';

export const DASHBOARD_RANGES = [
	'this_month',
	'this_week',
	'last_week',
] as const;

export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export class GetDashboardDto {
	@IsOptional()
	@IsIn(DASHBOARD_RANGES)
	range?: DashboardRange;
}
