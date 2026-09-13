import type { OrderDateRange } from './dto/get-order.dto';

export const ORDER_TIME_ZONE = 'Asia/Manila' as const;

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type OrderDateBoundary = {
	start: Date;
	end: Date;
};

function startOfManilaDay(date: Date): Date {
	const manilaDate = new Date(date.getTime() + MANILA_OFFSET_MS);

	return new Date(
		Date.UTC(
			manilaDate.getUTCFullYear(),
			manilaDate.getUTCMonth(),
			manilaDate.getUTCDate(),
		) - MANILA_OFFSET_MS,
	);
}

export function getOrderDateRange(
	range: OrderDateRange | undefined,
	now: Date = new Date(),
): OrderDateBoundary | undefined {
	if (!range || range === 'all') return undefined;

	const todayStart = startOfManilaDay(now);

	switch (range) {
		case 'today':
			return { start: todayStart, end: now };
		case 'yesterday':
			return {
				start: new Date(todayStart.getTime() - DAY_MS),
				end: new Date(todayStart.getTime() - 1),
			};
		case 'this_week': {
			const manilaDate = new Date(now.getTime() + MANILA_OFFSET_MS);
			const daysSinceMonday = (manilaDate.getUTCDay() + 6) % 7;

			return {
				start: new Date(
					todayStart.getTime() - daysSinceMonday * DAY_MS,
				),
				end: now,
			};
		}
	}
}
