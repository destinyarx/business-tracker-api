jest.mock(
	'../../../infrastructure/database/queries/account-erasure.queries',
	() => ({
		claimAccountErasureRequest: jest.fn(),
		completeAccountErasure: jest.fn(),
		eraseOperatorDatabase: jest.fn(),
		markAccountErasureCheckpoint: jest.fn(),
		markAccountErasureFailure: jest.fn(),
		scheduleAccountErasureReconciliation: jest.fn(),
	}),
);

import {
	claimAccountErasureRequest,
	completeAccountErasure,
	eraseOperatorDatabase,
	markAccountErasureCheckpoint,
	markAccountErasureFailure,
	scheduleAccountErasureReconciliation,
} from '../../../infrastructure/database/queries/account-erasure.queries';
import type { AccountErasureRequest } from '../../../infrastructure/database/schema/account-erasure-requests';
import { UserCachePurgeService } from '../../../infrastructure/cache/user-cache-purge.service';
import { AccountErasureConfigService } from '../account-erasure-config.service';
import { AccountErasureStorageService } from '../account-erasure-storage.service';
import { AccountErasureWorker } from '../account-erasure.worker';

const claim = jest.mocked(claimAccountErasureRequest);
const complete = jest.mocked(completeAccountErasure);
const eraseDatabase = jest.mocked(eraseOperatorDatabase);
const markCheckpoint = jest.mocked(markAccountErasureCheckpoint);
const markFailure = jest.mocked(markAccountErasureFailure);
const scheduleReconciliation = jest.mocked(
	scheduleAccountErasureReconciliation,
);

describe('AccountErasureWorker', () => {
	const request: AccountErasureRequest = {
		id: 1,
		webhookEventId: 'evt_1',
		clerkUserId: 'user_1',
		subjectHash: 'hash',
		status: 'processing',
		attemptCount: 1,
		nextAttemptAt: new Date(),
		receivedAt: new Date(),
		startedAt: new Date(),
		databaseDeletedAt: null,
		storageDeletedAt: null,
		cacheDeletedAt: null,
		reconciledAt: null,
		completedAt: null,
		lastErrorCode: null,
	};
	const config = {
		values: {
			maxAttempts: 3,
			processingTimeoutSeconds: 300,
			quietPeriodSeconds: 300,
		},
	} as AccountErasureConfigService;
	let storage: jest.Mocked<AccountErasureStorageService>;
	let cache: jest.Mocked<UserCachePurgeService>;
	let worker: AccountErasureWorker;

	beforeEach(() => {
		jest.clearAllMocks();
		storage = {
			erasePrefix: jest.fn().mockResolvedValue(2),
			isPrefixEmpty: jest.fn().mockResolvedValue(true),
		} as unknown as jest.Mocked<AccountErasureStorageService>;
		cache = {
			purge: jest.fn().mockResolvedValue(3),
		} as unknown as jest.Mocked<UserCachePurgeService>;
		worker = new AccountErasureWorker(config, storage, cache);
		eraseDatabase.mockResolvedValue({
			deleted: {
				customers: 1,
				expenses: 0,
				orderItems: 0,
				orders: 0,
				productVariants: 0,
				products: 0,
				sales: 0,
				schedules: 0,
				transactions: 0,
			},
			verification: {
				ownedRows: 0,
				dependentRows: 0,
				residualActorRows: 0,
			},
		});
	});

	it('checkpoints the first pass and schedules reconciliation', async () => {
		claim.mockResolvedValueOnce(request);

		await worker.processNext();

		expect(
			markCheckpoint.mock.calls.map(([, checkpoint]) => checkpoint),
		).toEqual(['databaseDeletedAt', 'storageDeletedAt', 'cacheDeletedAt']);
		expect(scheduleReconciliation).toHaveBeenCalledWith(
			request.id,
			expect.any(Date),
		);
		expect(complete).not.toHaveBeenCalled();
	});

	it('completes only after a clean reconciliation pass', async () => {
		claim.mockResolvedValueOnce({
			...request,
			attemptCount: 2,
			databaseDeletedAt: new Date(),
			storageDeletedAt: new Date(),
			cacheDeletedAt: new Date(),
		});
		cache.purge.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

		await worker.processNext();

		expect(eraseDatabase).toHaveBeenCalledTimes(1);
		expect(storage.erasePrefix.mock.calls).toHaveLength(1);
		expect(storage.isPrefixEmpty.mock.calls).toHaveLength(1);
		expect(cache.purge.mock.calls).toHaveLength(2);
		expect(complete).toHaveBeenCalledWith(request.id);
	});

	it('stores a sanitized retry code after a provider failure', async () => {
		claim.mockResolvedValueOnce(request);
		storage.erasePrefix.mockRejectedValueOnce(
			new Error('provider details'),
		);

		await worker.processNext();

		expect(markFailure).toHaveBeenCalledWith(
			request.id,
			'retry',
			'ACCOUNT_ERASURE_STORAGE_FAILED',
			expect.any(Date),
		);
	});

	it('does not claim twice while one local worker pass is running', async () => {
		let resolveClaim: (value: undefined) => void = () => undefined;
		claim.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveClaim = resolve;
				}),
		);

		const first = worker.processNext();
		await worker.processNext();
		resolveClaim(undefined);
		await first;

		expect(claim).toHaveBeenCalledTimes(1);
	});
});
