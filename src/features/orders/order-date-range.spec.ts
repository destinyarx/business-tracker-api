import { getOrderDateRange, ORDER_TIME_ZONE } from './order-date-range';

describe('getOrderDateRange', () => {
	const sundayInManila = new Date('2025-07-13T04:00:00.000Z');

	it('uses the explicit Manila timezone', () => {
		expect(ORDER_TIME_ZONE).toBe('Asia/Manila');
	});

	it('does not constrain all dates', () => {
		expect(getOrderDateRange('all', sundayInManila)).toBeUndefined();
	});

	it.each([
		['today', '2025-07-12T16:00:00.000Z', sundayInManila.toISOString()],
		['yesterday', '2025-07-11T16:00:00.000Z', '2025-07-12T15:59:59.999Z'],
		['this_week', '2025-07-06T16:00:00.000Z', sundayInManila.toISOString()],
	] as const)('calculates %s', (range, expectedStart, expectedEnd) => {
		const result = getOrderDateRange(range, sundayInManila);

		expect(result?.start.toISOString()).toBe(expectedStart);
		expect(result?.end.toISOString()).toBe(expectedEnd);
	});
});
