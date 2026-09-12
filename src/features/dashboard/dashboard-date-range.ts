import type { DashboardRange } from './dto/get-dashboard.dto';

export const DASHBOARD_TIME_ZONE = 'Asia/Manila' as const;

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_LABELS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
] as const;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type DashboardBucketRange = {
	key: string;
	label: string;
	start: Date;
	end: Date;
	dayKeys: string[];
};

export type DashboardDateRange = {
	key: DashboardRange;
	label: string;
	start: Date;
	end: Date;
	buckets: DashboardBucketRange[];
};

function toManilaDate(date: Date): Date {
	return new Date(date.getTime() + MANILA_OFFSET_MS);
}

function fromManilaParts(year: number, month: number, day: number): Date {
	return new Date(Date.UTC(year, month, day) - MANILA_OFFSET_MS);
}

function startOfManilaDay(date: Date): Date {
	const local = toManilaDate(date);
	return fromManilaParts(
		local.getUTCFullYear(),
		local.getUTCMonth(),
		local.getUTCDate(),
	);
}

export function getManilaDayKey(date: Date): string {
	const local = toManilaDate(date);
	const year = local.getUTCFullYear();
	const month = String(local.getUTCMonth() + 1).padStart(2, '0');
	const day = String(local.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getDayKeys(start: Date, end: Date): string[] {
	const keys: string[] = [];
	for (
		let cursor = startOfManilaDay(start);
		cursor.getTime() <= end.getTime();
		cursor = new Date(cursor.getTime() + DAY_MS)
	) {
		keys.push(getManilaDayKey(cursor));
	}
	return keys;
}

function dayBucket(start: Date, rangeEnd: Date): DashboardBucketRange {
	const local = toManilaDate(start);
	const end = new Date(Math.min(start.getTime() + DAY_MS - 1, rangeEnd.getTime()));
	return {
		key: getManilaDayKey(start),
		label: `${DAY_LABELS[local.getUTCDay()]} ${local.getUTCDate()}`,
		start,
		end,
		dayKeys: [getManilaDayKey(start)],
	};
}

function monthBucket(start: Date, rangeEnd: Date): DashboardBucketRange {
	const end = new Date(Math.min(start.getTime() + 7 * DAY_MS - 1, rangeEnd.getTime()));
	const startLocal = toManilaDate(start);
	const endLocal = toManilaDate(end);
	const startMonth = MONTH_LABELS[startLocal.getUTCMonth()];
	const endMonth = MONTH_LABELS[endLocal.getUTCMonth()];
	const label =
		startMonth === endMonth
			? `${startMonth} ${startLocal.getUTCDate()}–${endLocal.getUTCDate()}`
			: `${startMonth} ${startLocal.getUTCDate()}–${endMonth} ${endLocal.getUTCDate()}`;

	return {
		key: `${getManilaDayKey(start)}_${getManilaDayKey(end)}`,
		label,
		start,
		end,
		dayKeys: getDayKeys(start, end),
	};
}

export function getDashboardDateRange(
	range: DashboardRange,
	now: Date = new Date(),
): DashboardDateRange {
	const todayStart = startOfManilaDay(now);
	const local = toManilaDate(now);
	const daysSinceMonday = (local.getUTCDay() + 6) % 7;
	const thisWeekStart = new Date(todayStart.getTime() - daysSinceMonday * DAY_MS);

	let start: Date;
	let end = now;
	let label: string;

	switch (range) {
		case 'this_month':
			start = fromManilaParts(
				local.getUTCFullYear(),
				local.getUTCMonth(),
				1,
			);
			label = 'This month';
			break;
		case 'this_week':
			start = thisWeekStart;
			label = 'This week';
			break;
		case 'last_week':
			start = new Date(thisWeekStart.getTime() - 7 * DAY_MS);
			end = new Date(thisWeekStart.getTime() - 1);
			label = 'Last week';
			break;
	}

	const buckets: DashboardBucketRange[] = [];
	const step = range === 'this_month' ? 7 * DAY_MS : DAY_MS;
	for (
		let cursor = start;
		cursor.getTime() <= end.getTime();
		cursor = new Date(cursor.getTime() + step)
	) {
		buckets.push(
			range === 'this_month'
				? monthBucket(cursor, end)
				: dayBucket(cursor, end),
		);
	}

	return { key: range, label, start, end, buckets };
}

export function getDashboardExpenseHistoryStart(now: Date): Date {
	const local = toManilaDate(now);
	return fromManilaParts(
		local.getUTCFullYear(),
		local.getUTCMonth() - 3,
		1,
	);
}

export function getManilaMonthKey(date: Date): string {
	return getManilaDayKey(date).slice(0, 7);
}

export function getPreviousManilaMonthKeys(now: Date): string[] {
	const local = toManilaDate(now);
	return [3, 2, 1].map((monthsAgo) =>
		getManilaMonthKey(
			fromManilaParts(
				local.getUTCFullYear(),
				local.getUTCMonth() - monthsAgo,
				1,
			),
		),
	);
}
