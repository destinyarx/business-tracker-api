import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import {
	ClerkService,
	type ClerkTokenPayload,
} from '../../integrations/clerk/clerk.service';

type AuthenticatedRequest = FastifyRequest & {
	user?: ClerkTokenPayload;
};

@Injectable()
export class ClerkAuthGuard implements CanActivate {
	constructor(private readonly clerkService: ClerkService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const token = this.extractTokenFromHeader(req);

		if (!token) {
			throw new UnauthorizedException('Missing token');
		}

		try {
			const payload = await this.clerkService.verifyToken(token);

			req.user = payload;
			return true;
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('Clerk JWT verification failed:', message);
			throw new UnauthorizedException('Invalid or expired token');
		}
	}

	private extractTokenFromHeader(req: FastifyRequest): string | undefined {
		const authHeader = req.headers['authorization'];
		if (!authHeader) return undefined;

		const [type, token] = authHeader.split(' ');
		return type === 'Bearer' ? token : undefined;
	}
}
