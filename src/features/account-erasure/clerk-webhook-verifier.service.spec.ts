import { Webhook } from 'standardwebhooks';

import { AccountErasureConfigService } from './account-erasure-config.service';
import { ClerkWebhookVerifierService } from './clerk-webhook-verifier.service';

describe('ClerkWebhookVerifierService', () => {
	const signingSecret = `whsec_${Buffer.from('test-webhook-secret').toString('base64')}`;
	const verifier = new ClerkWebhookVerifierService({
		webhookSigningSecret: signingSecret,
	} as AccountErasureConfigService);
	const webhook = new Webhook(signingSecret);
	const eventId = 'evt_test';
	const body = JSON.stringify({
		type: 'user.deleted',
		data: { id: 'user_123' },
	});

	function headers(payload = body, timestamp = new Date()) {
		return {
			'svix-id': eventId,
			'svix-timestamp': String(Math.floor(timestamp.getTime() / 1000)),
			'svix-signature': webhook.sign(eventId, timestamp, payload),
		};
	}

	it('verifies the exact raw body', async () => {
		await expect(
			verifier.verify(Buffer.from(body), headers()),
		).resolves.toMatchObject({
			type: 'user.deleted',
			data: { id: 'user_123' },
		});
	});

	it('rejects an altered body', async () => {
		await expect(
			verifier.verify(Buffer.from(`${body} `), headers()),
		).rejects.toThrow();
	});

	it('rejects missing signature headers', async () => {
		await expect(verifier.verify(Buffer.from(body), {})).rejects.toThrow();
	});

	it('rejects a stale timestamp', async () => {
		const stale = new Date(Date.now() - 6 * 60 * 1000);
		await expect(
			verifier.verify(Buffer.from(body), headers(body, stale)),
		).rejects.toThrow();
	});
});
