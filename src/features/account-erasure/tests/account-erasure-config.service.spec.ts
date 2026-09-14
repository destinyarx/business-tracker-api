import { ConfigService } from '@nestjs/config';

import { AccountErasureConfigService } from '../account-erasure-config.service';

describe('AccountErasureConfigService', () => {
	function config(values: Record<string, string>) {
		return {
			getOrThrow: jest.fn((name: string) => {
				if (!(name in values)) throw new Error(`missing ${name}`);
				return values[name];
			}),
		} as unknown as ConfigService;
	}

	it('validates and parses worker configuration', () => {
		const service = new AccountErasureConfigService(
			config({
				CLERK_WEBHOOK_SIGNING_SECRET: 'whsec_test',
				ACCOUNT_ERASURE_HMAC_SECRET: 'hmac-secret',
				ACCOUNT_ERASURE_QUIET_PERIOD_SECONDS: '300',
				ACCOUNT_ERASURE_MAX_ATTEMPTS: '5',
			}),
		);

		expect(service.values).toMatchObject({
			quietPeriodSeconds: 300,
			maxAttempts: 5,
		});
	});

	it('requires at least two attempts for cleanup and reconciliation', () => {
		expect(
			() =>
				new AccountErasureConfigService(
					config({
						CLERK_WEBHOOK_SIGNING_SECRET: 'whsec_test',
						ACCOUNT_ERASURE_HMAC_SECRET: 'hmac-secret',
						ACCOUNT_ERASURE_QUIET_PERIOD_SECONDS: '300',
						ACCOUNT_ERASURE_MAX_ATTEMPTS: '1',
					}),
				),
		).toThrow('ACCOUNT_ERASURE_MAX_ATTEMPTS');
	});
});
