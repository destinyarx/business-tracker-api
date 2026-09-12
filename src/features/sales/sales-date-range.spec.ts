import { getSalesDateRange, SALES_TIME_ZONE } from './sales-date-range';

describe('getSalesDateRange', () => {
	const now = new Date('2026-09-09T04:30:00.000Z');

	it('uses the explicit Manila timezone', () => {
		expect(SALES_TIME_ZONE).toBe('Asia/Manila');
	});

	it.each([
		['today', '2026-09-08T16:00:00.000Z', now.toISOString()],
		['yesterday', '2026-09-07T16:00:00.000Z', '2026-09-08T15:59:59.999Z'],
		['this_week', '2026-09-06T16:00:00.000Z', now.toISOString()],
		['this_month', '2026-08-31T16:00:00.000Z', now.toISOString()],
	] as const)('calculates %s', (range, start, end) => {
		const result = getSalesDateRange(range, now);
		expect(result.start.toISOString()).toBe(start);
		expect(result.end.toISOString()).toBe(end);
	});
});
