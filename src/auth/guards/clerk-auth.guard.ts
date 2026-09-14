import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	ServiceUnavailableException,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import {
	ClerkService,
	type ClerkTokenPayload,
} from '../../integrations/clerk/clerk.service';
import { AccountErasureTombstoneService } from '../account-erasure-tombstone.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

type AuthenticatedRequest = FastifyRequest & {
	user?: ClerkTokenPayload;
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
	constructor(
		private readonly clerkService: ClerkService,
		private readonly reflector: Reflector,
		private readonly tombstones: AccountErasureTombstoneService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(
			IS_PUBLIC_KEY,
			[context.getHandler(), context.getClass()],
		);
		if (isPublic) return true;

		const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const token = this.extractTokenFromHeader(req);

		if (!token) {
			throw new UnauthorizedException('Missing token');
		}

		let payload: ClerkTokenPayload;
		try {
			payload = await this.clerkService.verifyToken(token);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('Clerk JWT verification failed:', message);
			throw new UnauthorizedException('Invalid or expired token');
		}

		try {
			if (await this.tombstones.isBlocked(payload.sub)) {
				throw new ForbiddenException('Account deletion is in progress');
			}
		} catch (error) {
			if (error instanceof ForbiddenException) throw error;
			throw new ServiceUnavailableException(
				'Unable to verify account deletion state',
			);
		}

		req.user = payload;
		return true;
	}

	private extractTokenFromHeader(req: FastifyRequest): string | undefined {
		const authHeader = req.headers['authorization'];
		if (!authHeader) return undefined;

		const [type, token] = authHeader.split(' ');
		return type === 'Bearer' ? token : undefined;
	}
}
