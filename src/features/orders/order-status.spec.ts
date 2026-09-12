import { getOrderTransition } from './order-status';

describe('getOrderTransition', () => {
	it.each([
		['pending', 'in_progress', 'deduct', 'none'],
		['in_progress', 'completed', 'none', 'activate'],
		['completed', 'in_progress', 'none', 'revert'],
		['completed', 'cancelled', 'restore', 'revert'],
		['completed', 'failed', 'restore', 'revert'],
		['cancelled', 'in_progress', 'deduct', 'none'],
		['failed', 'in_progress', 'deduct', 'none'],
	] as const)(
		'allows %s to %s with %s stock and %s sale effects',
		(current, target, stock, sale) => {
			expect(getOrderTransition(current, target)).toEqual({
				allowed: true,
				stock,
				sale,
			});
		},
	);

	it('rejects a transition back to pending', () => {
		expect(getOrderTransition('completed', 'pending')).toEqual({
			allowed: false,
			stock: 'none',
			sale: 'none',
		});
	});

	it('treats the same status as an idempotent no-op', () => {
		expect(getOrderTransition('completed', 'completed')).toEqual({
			allowed: true,
			stock: 'none',
			sale: 'none',
		});
	});
});
