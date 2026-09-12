import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { randomUUID } from 'node:crypto';
import type {
	SaleStateFilter,
	SalesRange,
	SalesSortDirection,
} from './dto/get-sales.dto';

@Injectable()
export class SalesCacheService {
	constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

	async generation(userId: string): Promise<string> {
		return (
			(await this.cacheManager.get<string>(this.generationKey(userId))) ??
			'0'
		);
	}

	async rotate(userId: string): Promise<void> {
		await this.cacheManager.set(this.generationKey(userId), randomUUID());
	}

	listKey(
		userId: string,
		generation: string,
		range: SalesRange,
		state: SaleStateFilter,
		sort: SalesSortDirection,
	): string {
		return `sales:${userId}:${generation}:${range}:${state}:${sort}`;
	}

	detailKey(userId: string, generation: string, id: number): string {
		return `sales:${userId}:${generation}:detail:${id}`;
	}

	private generationKey(userId: string): string {
		return `sales:${userId}:generation`;
	}
}
