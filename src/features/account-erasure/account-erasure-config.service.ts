import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AccountErasureConfig } from './account-erasure.types';

@Injectable()
export class AccountErasureConfigService {
	readonly values: AccountErasureConfig;
	readonly webhookSigningSecret: string;

	constructor(configService: ConfigService) {
		this.webhookSigningSecret = configService.getOrThrow<string>(
			'CLERK_WEBHOOK_SIGNING_SECRET',
		);
		configService.getOrThrow<string>('ACCOUNT_ERASURE_HMAC_SECRET');

		this.values = {
			quietPeriodSeconds: this.positiveInteger(
				configService.getOrThrow<string>(
					'ACCOUNT_ERASURE_QUIET_PERIOD_SECONDS',
				),
				'ACCOUNT_ERASURE_QUIET_PERIOD_SECONDS',
			),
			maxAttempts: this.positiveInteger(
				configService.getOrThrow<string>(
					'ACCOUNT_ERASURE_MAX_ATTEMPTS',
				),
				'ACCOUNT_ERASURE_MAX_ATTEMPTS',
				2,
			),
			processingTimeoutSeconds: 300,
		};
	}

	private positiveInteger(value: string, name: string, minimum = 1): number {
		const parsed = Number(value);
		if (!Number.isSafeInteger(parsed) || parsed < minimum) {
			throw new Error(
				`${name} must be an integer of at least ${minimum}`,
			);
		}
		return parsed;
	}
}
