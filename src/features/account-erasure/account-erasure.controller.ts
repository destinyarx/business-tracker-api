import {
	BadRequestException,
	Controller,
	HttpCode,
	Logger,
	Post,
	Req,
	Res,
	type RawBodyRequest,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { Public } from '../../auth/decorators/public.decorator';
import { AccountErasureService } from './account-erasure.service';
import { ClerkWebhookVerifierService } from './clerk-webhook-verifier.service';
import type { VerifiedClerkWebhook } from './account-erasure.types';

@Controller('webhooks')
export class AccountErasureController {
	private readonly logger = new Logger(AccountErasureController.name);

	constructor(
		private readonly verifier: ClerkWebhookVerifierService,
		private readonly accountErasure: AccountErasureService,
	) {}

	@Post('clerk')
	@Public()
	@SkipThrottle()
	@HttpCode(202)
	async handleClerkWebhook(
		@Req() request: RawBodyRequest<FastifyRequest>,
		@Res({ passthrough: true }) reply: FastifyReply,
	) {
		const contentType = this.header(request, 'content-type');
		if (!contentType?.toLowerCase().startsWith('application/json')) {
			throw new BadRequestException('Webhook content type must be JSON');
		}
		if (!Buffer.isBuffer(request.rawBody)) {
			throw new BadRequestException('Missing raw webhook body');
		}

		let event: VerifiedClerkWebhook;
		try {
			event = await this.verifier.verify(
				request.rawBody,
				request.headers,
			);
		} catch {
			this.log('rejected', { reason: 'signature' });
			throw new BadRequestException('Invalid webhook signature');
		}

		const webhookEventId = this.header(request, 'svix-id');
		if (event.type !== 'user.deleted') {
			this.log('ignored', { providerEventId: webhookEventId });
			reply.status(200);
			return { data: { ignored: true }, message: 'Webhook ignored' };
		}

		const clerkUserId = event.data?.id;
		if (
			typeof clerkUserId !== 'string' ||
			!/^user_[A-Za-z0-9]+$/.test(clerkUserId) ||
			!webhookEventId
		) {
			this.log('rejected', {
				providerEventId: webhookEventId,
				reason: 'payload',
			});
			throw new BadRequestException('Invalid user deletion payload');
		}

		let result: Awaited<ReturnType<AccountErasureService['enqueue']>>;
		try {
			result = await this.accountErasure.enqueue(
				webhookEventId,
				clerkUserId,
			);
		} catch (error) {
			this.log('persistence_failed', { providerEventId: webhookEventId });
			throw error;
		}
		this.log(result.created ? 'accepted' : 'duplicate', {
			providerEventId: webhookEventId,
			requestId: result.request.id,
		});

		return {
			data: { accepted: true, duplicate: !result.created },
			message: result.created
				? 'Account erasure accepted'
				: 'Account erasure already accepted',
		};
	}

	private header(request: FastifyRequest, name: string): string | undefined {
		const value = request.headers[name];
		return Array.isArray(value) ? value[0] : value;
	}

	private log(
		status: string,
		fields: Record<string, number | string | undefined>,
	): void {
		this.logger.log(
			JSON.stringify({
				event: 'account_erasure_webhook',
				status,
				...fields,
			}),
		);
	}
}
