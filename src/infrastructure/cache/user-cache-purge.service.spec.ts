import type { Cache } from 'cache-manager';

import { UserCachePurgeService } from './user-cache-purge.service';

describe('UserCachePurgeService', () => {
	it('deletes only exact operator cache-key forms', async () => {
		async function* iterator() {
			await Promise.resolve();
			yield ['user_1:/products', {}];
			yield ['user_10:/products', {}];
			yield ['sales:user_1:generation', {}];
			yield ['sales:user_10:generation', {}];
			yield ['unrelated:user_1:value', {}];
		}
		const del = jest.fn((key: string) => {
			void key;
			return Promise.resolve(true);
		});
		const cache = {
			stores: [{ iterator }],
			del,
		} as unknown as Cache;
		const service = new UserCachePurgeService(cache);

		await expect(service.purge('user_1')).resolves.toBe(2);
		expect(del.mock.calls.map(([key]) => key)).toEqual([
			'user_1:/products',
			'sales:user_1:generation',
		]);
	});
});
