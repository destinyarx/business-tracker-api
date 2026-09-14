import {
	ForbiddenException,
	ServiceUnavailableException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { AccountErasureTombstoneService } from '../account-erasure-tombstone.service';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkService } from '../../integrations/clerk/clerk.service';

describe('ClerkAuthGuard account-erasure policy', () => {
	function context(request: Record<string, unknown>) {
		return {
			getHandler: jest.fn(),
			getClass: jest.fn(),
			switchToHttp: () => ({ getRequest: () => request }),
		} as unknown as ExecutionContext;
	}

	it('allows a public webhook without bearer authentication', async () => {
		const guard = new ClerkAuthGuard(
			{} as ClerkService,
			{ getAllAndOverride: jest.fn().mockReturnValue(true) } as never,
			{} as AccountErasureTombstoneService,
		);

		await expect(guard.canActivate(context({ headers: {} }))).resolves.toBe(
			true,
		);
	});

	it('rejects a subject with an erasure tombstone', async () => {
		const guard = new ClerkAuthGuard(
			{
				verifyToken: jest.fn().mockResolvedValue({ sub: 'user_1' }),
			} as unknown as ClerkService,
			{ getAllAndOverride: jest.fn().mockReturnValue(false) } as never,
			{
				isBlocked: jest.fn().mockResolvedValue(true),
			} as unknown as AccountErasureTombstoneService,
		);

		await expect(
			guard.canActivate(
				context({ headers: { authorization: 'Bearer token' } }),
			),
		).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('fails closed when tombstone lookup is unavailable', async () => {
		const guard = new ClerkAuthGuard(
			{
				verifyToken: jest.fn().mockResolvedValue({ sub: 'user_1' }),
			} as unknown as ClerkService,
			{ getAllAndOverride: jest.fn().mockReturnValue(false) } as never,
			{
				isBlocked: jest
					.fn()
					.mockRejectedValue(new Error('database down')),
			} as unknown as AccountErasureTombstoneService,
		);

		await expect(
			guard.canActivate(
				context({ headers: { authorization: 'Bearer token' } }),
			),
		).rejects.toBeInstanceOf(ServiceUnavailableException);
	});
});
