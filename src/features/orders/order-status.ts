import type { OrderStatus } from './dto/create-order.dto';

export type StockEffect = 'deduct' | 'restore' | 'none';
export type SaleEffect = 'activate' | 'revert' | 'none';

export type OrderTransition = {
	allowed: boolean;
	stock: StockEffect;
	sale: SaleEffect;
};

const allowedTargets: Record<OrderStatus, readonly OrderStatus[]> = {
	pending: ['in_progress', 'cancelled', 'failed'],
	in_progress: ['completed', 'cancelled', 'failed'],
	completed: ['in_progress', 'cancelled', 'failed'],
	cancelled: ['in_progress'],
	failed: ['in_progress'],
};

export function getOrderTransition(
	current: OrderStatus,
	target: OrderStatus,
): OrderTransition {
	if (current === target) {
		return { allowed: true, stock: 'none', sale: 'none' };
	}

	if (!allowedTargets[current].includes(target)) {
		return { allowed: false, stock: 'none', sale: 'none' };
	}

	const stock: StockEffect =
		target === 'in_progress' && current !== 'completed'
			? 'deduct'
			: (current === 'in_progress' || current === 'completed') &&
				  (target === 'cancelled' || target === 'failed')
				? 'restore'
				: 'none';

	const sale: SaleEffect =
		target === 'completed'
			? 'activate'
			: current === 'completed'
				? 'revert'
				: 'none';

	return { allowed: true, stock, sale };
}
