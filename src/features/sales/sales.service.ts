import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
	getSaleById,
	getSales,
} from '../../infrastructure/database/queries/sales.queries';
import { GetSalesDto } from './dto/get-sales.dto';
import { SalesCacheService } from './sales-cache.service';
import { getSalesDateRange } from './sales-date-range';

@Injectable()
export class SalesService {
	constructor(
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly salesCache: SalesCacheService,
	) {}

	async findAll(userId: string, params: GetSalesDto) {
		const range = params.range ?? 'today';
		const state = params.state ?? 'active';
		const sort = params.sort ?? 'desc';
		const generation = await this.salesCache.generation(userId);
		const cacheKey = this.salesCache.listKey(
			userId,
			generation,
			range,
			state,
			sort,
		);
		let records =
			await this.cacheManager.get<Awaited<ReturnType<typeof getSales>>>(
				cacheKey,
			);

		if (!records) {
			records = await getSales(
				userId,
				getSalesDateRange(range),
				state,
				sort,
			);
			await this.cacheManager.set(cacheKey, records);
		}

		const search = params.search?.trim().toLocaleLowerCase();
		if (!search) return records;

		return records.filter((sale) =>
			[sale.orderName, sale.customerName, sale.notes]
				.filter((value): value is string => typeof value === 'string')
				.some((value) => value.toLocaleLowerCase().includes(search)),
		);
	}

	async findOne(id: number, userId: string) {
		const generation = await this.salesCache.generation(userId);
		const cacheKey = this.salesCache.detailKey(userId, generation, id);
		const cached =
			await this.cacheManager.get<
				Awaited<ReturnType<typeof getSaleById>>
			>(cacheKey);
		if (cached) return cached;

		const sale = await getSaleById(id, userId);
		if (!sale) throw new NotFoundException('Sale not found');

		await this.cacheManager.set(cacheKey, sale);
		return sale;
	}
}
