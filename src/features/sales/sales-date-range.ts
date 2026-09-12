import type { SalesRange } from './dto/get-sales.dto';

export const SALES_TIME_ZONE = 'Asia/Manila';
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

export type SalesDateRange = {
	start: Date;
	end: Date;
};

function manilaStartOfDay(date: Date): Date {
	const local = new Date(date.getTime() + MANILA_OFFSET_MS);
	return new Date(
		Date.UTC(
			local.getUTCFullYear(),
			local.getUTCMonth(),
			local.getUTCDate(),
		) - MANILA_OFFSET_MS,
	);
}

export function getSalesDateRange(
	range: SalesRange,
	now: Date = new Date(),
): SalesDateRange {
	const todayStart = manilaStartOfDay(now);

	switch (range) {
		case 'today':
			return { start: todayStart, end: now };
		case 'yesterday':
			return {
				start: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000),
				end: new Date(todayStart.getTime() - 1),
			};
		case 'this_week': {
			const local = new Date(now.getTime() + MANILA_OFFSET_MS);
			const daysSinceMonday = (local.getUTCDay() + 6) % 7;
			return {
				start: new Date(
					todayStart.getTime() -
						daysSinceMonday * 24 * 60 * 60 * 1000,
				),
				end: now,
			};
		}
		case 'this_month': {
			const local = new Date(now.getTime() + MANILA_OFFSET_MS);
			return {
				start: new Date(
					Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) -
						MANILA_OFFSET_MS,
				),
				end: now,
			};
		}
	}
}
