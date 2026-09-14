import { Injectable } from '@nestjs/common';
import { verifyWebhook } from '@clerk/backend/webhooks';
import type { IncomingHttpHeaders } from 'node:http';

import { AccountErasureConfigService } from './account-erasure-config.service';
import type { VerifiedClerkWebhook } from './account-erasure.types';

const SIGNATURE_HEADERS = [
	'svix-id',
	'svix-timestamp',
	'svix-signature',
] as const;

@Injectable()
export class ClerkWebhookVerifierService {
	constructor(private readonly config: AccountErasureConfigService) {}

	async verify(
		rawBody: Buffer,
		incomingHeaders: IncomingHttpHeaders,
	): Promise<VerifiedClerkWebhook> {
		const headers = new Headers();
		for (const name of SIGNATURE_HEADERS) {
			const value = incomingHeaders[name];
			if (Array.isArray(value)) {
				headers.set(name, value.join(' '));
			} else if (value) {
				headers.set(name, value);
			}
		}

		const request = new Request('http://localhost/webhooks/clerk', {
			method: 'POST',
			headers,
			body: new Uint8Array(rawBody),
		});
		const event = await verifyWebhook(request, {
			signingSecret: this.config.webhookSigningSecret,
		});

		return event as VerifiedClerkWebhook;
	}
}
