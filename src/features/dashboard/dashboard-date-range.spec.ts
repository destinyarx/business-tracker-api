import {
	DASHBOARD_TIME_ZONE,
	getDashboardDateRange,
	getDashboardExpenseHistoryStart,
	getPreviousManilaMonthKeys,
} from './dashboard-date-range';

describe('getDashboardDateRange', () => {
	const now = new Date('2026-09-09T04:30:00.000Z');

	it('uses the Manila timezone and month-to-date boundaries', () => {
		const range = getDashboardDateRange('this_month', now);

		expect(DASHBOARD_TIME_ZONE).toBe('Asia/Manila');
		expect(range.start.toISOString()).toBe('2026-08-31T16:00:00.000Z');
		expect(range.end).toBe(now);
		expect(range.buckets).toHaveLength(2);
		expect(range.buckets[0]).toMatchObject({
			label: 'Sep 1–7',
			dayKeys: [
				'2026-09-01',
				'2026-09-02',
				'2026-09-03',
				'2026-09-04',
				'2026-09-05',
				'2026-09-06',
				'2026-09-07',
			],
		});
		expect(range.buckets[1].end).toEqual(now);
	});

	it('starts this week on Manila Monday and ends at now', () => {
		const range = getDashboardDateRange('this_week', now);

		expect(range.start.toISOString()).toBe('2026-09-06T16:00:00.000Z');
		expect(range.end).toBe(now);
		expect(range.buckets.map((bucket) => bucket.label)).toEqual([
			'Mon 7',
			'Tue 8',
			'Wed 9',
		]);
	});

	it('returns the full previous Manila week', () => {
		const range = getDashboardDateRange('last_week', now);

		expect(range.start.toISOString()).toBe('2026-08-30T16:00:00.000Z');
		expect(range.end.toISOString()).toBe('2026-09-06T15:59:59.999Z');
		expect(range.buckets).toHaveLength(7);
		expect(range.buckets[0].label).toBe('Mon 31');
		expect(range.buckets[6].label).toBe('Sun 6');
	});

	it('uses the Manila date when UTC is still on Sunday', () => {
		const mondayInManila = new Date('2026-09-06T18:00:00.000Z');
		const range = getDashboardDateRange('this_week', mondayInManila);

		expect(range.start.toISOString()).toBe('2026-09-06T16:00:00.000Z');
		expect(range.buckets).toHaveLength(1);
	});

	it('handles prior-month history across a year boundary', () => {
		const january = new Date('2027-01-15T00:00:00.000Z');

		expect(getDashboardExpenseHistoryStart(january).toISOString()).toBe(
			'2026-09-30T16:00:00.000Z',
		);
		expect(getPreviousManilaMonthKeys(january)).toEqual([
			'2026-10',
			'2026-11',
			'2026-12',
		]);
	});
});
