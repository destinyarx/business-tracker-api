import {
	Inject,
	Injectable,
	BadRequestException,
	ConflictException,
	NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status-dto';
import { GetOrderDto } from './dto/get-order.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
	addOrder,
	getOrderById,
	updateOrder,
	deleteOrder,
	updateOrderStatus,
	getOrdersPaginated,
} from '../../infrastructure/database/queries/orders.queries';
import { SalesCacheService } from '../sales/sales-cache.service';

@Injectable()
export class OrdersService {
	constructor(
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private readonly salesCache: SalesCacheService,
	) {}

	async create(userId: string, createOrderDto: CreateOrderDto) {
		try {
			const order = await addOrder(userId, createOrderDto);

			await this.cacheManager.del(`${userId}:/orders`);
			return order;
		} catch (error) {
			console.log(error);
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}
	}

	async findAll(params: GetOrderDto, userId: string) {
		try {
			console.log(params);
			return await getOrdersPaginated(params, userId);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}
	}

	async findOne(id: number, userId: string) {
		try {
			return await getOrderById(id, userId);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Unexpected error occurs';
			throw new BadRequestException(message);
		}
	}

	async update(id: number, userId: string, updateOrderDto: UpdateOrderDto) {
		const response = await updateOrder(id, updateOrderDto, userId);
		if (response.kind === 'not_found') {
			throw new NotFoundException('Order not found');
		}
		if (response.kind === 'completed') {
			throw new ConflictException(
				'Move the completed order to another status before editing it',
			);
		}

		await this.cacheManager.del(`${userId}:/orders`);
		if (response.hadSale) await this.salesCache.rotate(userId);
		return { id: response.id };
	}

	async remove(id: number, userId: string) {
		const response = await deleteOrder(id, userId);
		if (response.kind === 'not_found') {
			throw new NotFoundException('Order not found');
		}
		if (response.kind === 'has_sale') {
			throw new ConflictException(
				'Orders that have produced a sale cannot be deleted',
			);
		}

		await this.cacheManager.del(`${userId}:/orders`);
		return { id: response.id };
	}

	async updateOrderStatus(
		id: number,
		data: UpdateOrderStatusDto,
		userId: string,
	) {
		const response = await updateOrderStatus(id, data, userId);

		switch (response.kind) {
			case 'not_found':
				throw new NotFoundException('Order not found');
			case 'invalid_transition':
				throw new ConflictException(
					'Order status transition is not allowed',
				);
			case 'missing_reversal_reason':
				throw new BadRequestException(
					'A reversal reason is required when leaving completed status',
				);
			case 'insufficient_stock':
				throw new ConflictException('Insufficient stock');
			case 'product_not_found':
				throw new ConflictException(
					'An order item references an unavailable product',
				);
			case 'sale_not_found':
				throw new ConflictException(
					'The completed order has no sale record to reverse',
				);
			case 'invalid_order_total':
				throw new ConflictException('The order has no total amount');
			case 'unchanged':
				return { id: response.id, changed: false };
		}

		await this.cacheManager.del(`${userId}:/orders`);
		await this.cacheManager.del(`${userId}:/products`);
		await this.salesCache.rotate(userId);
		return { id: response.id, changed: true };
	}
}
