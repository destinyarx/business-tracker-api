import { BadRequestException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { AccountErasureController } from './account-erasure.controller';
import { AccountErasureService } from './account-erasure.service';
import { ClerkWebhookVerifierService } from './clerk-webhook-verifier.service';

describe('AccountErasureController', () => {
	const rawBody = Buffer.from('{"type":"user.deleted"}');
	const request = {
		rawBody,
		headers: {
			'content-type': 'application/json',
			'svix-id': 'evt_123',
		},
	} as unknown as RawBodyRequest<FastifyRequest>;
	const replyStatus = jest.fn();
	const reply = { status: replyStatus } as unknown as FastifyReply;

	beforeEach(() => jest.clearAllMocks());

	it('enqueues a verified user deletion once', async () => {
		const verify = jest.fn().mockResolvedValue({
			type: 'user.deleted',
			data: { id: 'user_123' },
		});
		const enqueue = jest.fn().mockResolvedValue({
			created: true,
			request: { id: 1 },
		});
		const controller = new AccountErasureController(
			{ verify } as unknown as ClerkWebhookVerifierService,
			{ enqueue } as unknown as AccountErasureService,
		);

		await expect(
			controller.handleClerkWebhook(request, reply),
		).resolves.toMatchObject({
			data: { accepted: true, duplicate: false },
		});
		expect(verify).toHaveBeenCalledWith(rawBody, request.headers);
		expect(enqueue).toHaveBeenCalledWith('evt_123', 'user_123');
	});

	it('does not enqueue an invalid signature', async () => {
		const enqueue = jest.fn();
		const controller = new AccountErasureController(
			{
				verify: jest.fn().mockRejectedValue(new Error('invalid')),
			} as unknown as ClerkWebhookVerifierService,
			{ enqueue } as unknown as AccountErasureService,
		);

		await expect(
			controller.handleClerkWebhook(request, reply),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(enqueue).not.toHaveBeenCalled();
	});

	it('ignores other verified event types', async () => {
		const enqueue = jest.fn();
		const controller = new AccountErasureController(
			{
				verify: jest.fn().mockResolvedValue({
					type: 'user.updated',
					data: { id: 'user_123' },
				}),
			} as unknown as ClerkWebhookVerifierService,
			{ enqueue } as unknown as AccountErasureService,
		);

		await expect(
			controller.handleClerkWebhook(request, reply),
		).resolves.toMatchObject({ data: { ignored: true } });
		expect(replyStatus).toHaveBeenCalledWith(200);
		expect(enqueue).not.toHaveBeenCalled();
	});

	it('rejects a malformed verified deletion event', async () => {
		const enqueue = jest.fn();
		const controller = new AccountErasureController(
			{
				verify: jest.fn().mockResolvedValue({
					type: 'user.deleted',
					data: {},
				}),
			} as unknown as ClerkWebhookVerifierService,
			{ enqueue } as unknown as AccountErasureService,
		);

		await expect(
			controller.handleClerkWebhook(request, reply),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(enqueue).not.toHaveBeenCalled();
	});

	it('propagates persistence failures so Clerk can retry', async () => {
		const controller = new AccountErasureController(
			{
				verify: jest.fn().mockResolvedValue({
					type: 'user.deleted',
					data: { id: 'user_123' },
				}),
			} as unknown as ClerkWebhookVerifierService,
			{
				enqueue: jest
					.fn()
					.mockRejectedValue(new Error('database down')),
			} as unknown as AccountErasureService,
		);

		await expect(
			controller.handleClerkWebhook(request, reply),
		).rejects.toThrow('database down');
	});
});
