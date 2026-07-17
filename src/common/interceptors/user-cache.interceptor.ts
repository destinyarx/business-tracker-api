import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

type AuthenticatedRequest = FastifyRequest & {
  user: { sub: string };
};

@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // const userId = req.user.userId.sub;
    const userId = req.user.sub;
    const method = req.method;
    const path = req.routeOptions.url;

    // Only cache GET
    if (method !== 'GET') return undefined;

    // No user → no caching
    if (!userId) return undefined;

    // Build universal cache key for ALL endpoints
    const key = `${userId}:${path}`;

    // Optional debug
    console.log('CACHE KEY:', key);

    return key;
  }
}

