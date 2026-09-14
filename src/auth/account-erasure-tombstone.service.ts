import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

import { hasAccountErasureTombstone } from '../infrastructure/database/queries/account-erasure.queries';

@Injectable()
export class AccountErasureTombstoneService {
	constructor(private readonly configService: ConfigService) {}

	hashSubject(clerkUserId: string): string {
		return createHmac(
			'sha256',
			this.configService.getOrThrow<string>(
				'ACCOUNT_ERASURE_HMAC_SECRET',
			),
		)
			.update(clerkUserId)
			.digest('hex');
	}

	async isBlocked(clerkUserId: string): Promise<boolean> {
		return hasAccountErasureTombstone(this.hashSubject(clerkUserId));
	}
}
