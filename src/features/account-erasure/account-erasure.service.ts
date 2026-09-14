import { Injectable } from '@nestjs/common';

import { AccountErasureTombstoneService } from '../../auth/account-erasure-tombstone.service';
import { enqueueAccountErasure } from '../../infrastructure/database/queries/account-erasure.queries';

@Injectable()
export class AccountErasureService {
	constructor(private readonly tombstones: AccountErasureTombstoneService) {}

	async enqueue(webhookEventId: string, clerkUserId: string) {
		return enqueueAccountErasure(
			webhookEventId,
			clerkUserId,
			this.tombstones.hashSubject(clerkUserId),
		);
	}
}
