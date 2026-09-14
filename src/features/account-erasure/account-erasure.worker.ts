import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { UserCachePurgeService } from '../../infrastructure/cache/user-cache-purge.service';
import {
	claimAccountErasureRequest,
	completeAccountErasure,
	eraseOperatorDatabase,
	markAccountErasureCheckpoint,
	markAccountErasureFailure,
	scheduleAccountErasureReconciliation,
} from '../../infrastructure/database/queries/account-erasure.queries';
import type { AccountErasureRequest } from '../../infrastructure/database/schema/account-erasure-requests';
import { AccountErasureConfigService } from './account-erasure-config.service';
import { AccountErasureStorageService } from './account-erasure-storage.service';

type ErasureStage = 'claim' | 'database' | 'storage' | 'cache' | 'reconcile';

@Injectable()
export class AccountErasureWorker {
	private readonly logger = new Logger(AccountErasureWorker.name);
	private running = false;

	constructor(
		private readonly config: AccountErasureConfigService,
		private readonly storage: AccountErasureStorageService,
		private readonly cache: UserCachePurgeService,
	) {}

	@Interval(10_000)
	async processNext(): Promise<void> {
		if (this.running) return;
		this.running = true;

		let request: AccountErasureRequest | undefined;
		let stage: ErasureStage = 'claim';
		const startedAt = Date.now();

		try {
			request = await claimAccountErasureRequest(
				this.config.values.processingTimeoutSeconds,
			);
			if (!request) return;
			if (!request.clerkUserId) throw new Error('MISSING_CLERK_USER_ID');

			const isReconciliation = Boolean(
				request.databaseDeletedAt &&
					request.storageDeletedAt &&
					request.cacheDeletedAt,
			);

			if (isReconciliation) {
				stage = 'reconcile';
				const database = await eraseOperatorDatabase(
					request.clerkUserId,
				);
				const storageDeleted = await this.storage.erasePrefix(
					request.clerkUserId,
				);
				const cacheDeleted = await this.cache.purge(
					request.clerkUserId,
				);
				const cacheResidual = await this.cache.purge(
					request.clerkUserId,
				);
				const storageEmpty = await this.storage.isPrefixEmpty(
					request.clerkUserId,
				);

				if (
					database.verification.ownedRows > 0 ||
					database.verification.dependentRows > 0 ||
					!storageEmpty ||
					cacheResidual > 0
				) {
					throw new Error('RECONCILIATION_NOT_EMPTY');
				}

				await completeAccountErasure(request.id);
				this.log('completed', request, startedAt, {
					databaseRows: sumCounts(database.deleted),
					storageObjects: storageDeleted,
					cacheKeys: cacheDeleted,
					residualActorRows: database.verification.residualActorRows,
				});
				return;
			}

			let databaseRows = 0;
			let storageObjects = 0;
			let cacheKeys = 0;

			if (!request.databaseDeletedAt) {
				stage = 'database';
				const database = await eraseOperatorDatabase(
					request.clerkUserId,
				);
				if (
					database.verification.ownedRows > 0 ||
					database.verification.dependentRows > 0
				) {
					throw new Error('DATABASE_NOT_EMPTY');
				}
				databaseRows = sumCounts(database.deleted);
				await markAccountErasureCheckpoint(
					request.id,
					'databaseDeletedAt',
				);
			}

			if (!request.storageDeletedAt) {
				stage = 'storage';
				storageObjects = await this.storage.erasePrefix(
					request.clerkUserId,
				);
				if (!(await this.storage.isPrefixEmpty(request.clerkUserId))) {
					throw new Error('STORAGE_NOT_EMPTY');
				}
				await markAccountErasureCheckpoint(
					request.id,
					'storageDeletedAt',
				);
			}

			if (!request.cacheDeletedAt) {
				stage = 'cache';
				cacheKeys = await this.cache.purge(request.clerkUserId);
				await markAccountErasureCheckpoint(
					request.id,
					'cacheDeletedAt',
				);
			}

			await scheduleAccountErasureReconciliation(
				request.id,
				new Date(
					Date.now() + this.config.values.quietPeriodSeconds * 1000,
				),
			);
			this.log('reconciliation_scheduled', request, startedAt, {
				databaseRows,
				storageObjects,
				cacheKeys,
			});
		} catch (error) {
			if (request) await this.fail(request, stage, error, startedAt);
			else if (stage === 'claim')
				this.logger.error('Account erasure claim failed');
		} finally {
			this.running = false;
		}
	}

	private async fail(
		request: AccountErasureRequest,
		stage: ErasureStage,
		_error: unknown,
		startedAt: number,
	): Promise<void> {
		const exhausted =
			request.attemptCount >= this.config.values.maxAttempts;
		const delaySeconds = Math.min(
			30 * 2 ** Math.max(0, request.attemptCount - 1),
			3_600,
		);
		const errorCode = `ACCOUNT_ERASURE_${stage.toUpperCase()}_FAILED`;

		await markAccountErasureFailure(
			request.id,
			exhausted ? 'failed' : 'retry',
			errorCode,
			new Date(Date.now() + delaySeconds * 1000),
		);
		this.log(exhausted ? 'failed' : 'retry_scheduled', request, startedAt, {
			errorCode,
		});
	}

	private log(
		status: string,
		request: AccountErasureRequest,
		startedAt: number,
		counts: Record<string, number | string>,
	): void {
		this.logger.log(
			JSON.stringify({
				event: 'account_erasure',
				requestId: request.id,
				providerEventId: request.webhookEventId,
				status,
				attempt: request.attemptCount,
				durationMs: Date.now() - startedAt,
				...counts,
			}),
		);
	}
}

function sumCounts(counts: Record<string, number>): number {
	return Object.values(counts).reduce((total, value) => total + value, 0);
}
