import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

const DELETE_BATCH_SIZE = 100;

@Injectable()
export class UserCachePurgeService {
	constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

	async purge(clerkUserId: string): Promise<number> {
		const keys = new Set<string>();

		for (const store of this.cacheManager.stores) {
			if (!store.iterator) {
				throw new Error('CACHE_STORE_ITERATOR_UNAVAILABLE');
			}

			const iterator = store.iterator(undefined) as AsyncGenerator<
				[string, unknown],
				void
			>;
			for await (const [key] of iterator) {
				if (this.belongsToOperator(key, clerkUserId)) keys.add(key);
			}
		}

		let deleted = 0;
		const allKeys = [...keys];
		for (
			let offset = 0;
			offset < allKeys.length;
			offset += DELETE_BATCH_SIZE
		) {
			const batch = allKeys.slice(offset, offset + DELETE_BATCH_SIZE);
			const results = await Promise.all(
				batch.map((key) => this.cacheManager.del(key)),
			);
			deleted += results.filter(Boolean).length;
		}

		return deleted;
	}

	private belongsToOperator(key: string, clerkUserId: string): boolean {
		return (
			key.startsWith(`${clerkUserId}:`) ||
			key.startsWith(`sales:${clerkUserId}:`)
		);
	}
}
