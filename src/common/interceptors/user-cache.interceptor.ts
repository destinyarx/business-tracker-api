import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';
@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const req = context.switchToHttp().getRequest();
    // const userId = req.user.userId.sub;
    const userId = req.user.sub;
    const method = req.method;
    const path = req.route?.path;

    // console.log('CACHE TRACK BY:', { 
    //   timestamp: new Date().toISOString(),
    //   method, 
    //   path, 
    //   userId 
    // })

    // Only cache GET
    if (method !== 'GET') return undefined;

    // No user → no caching
    if (!userId) return undefined;

    // Build universal cache key for ALL endpoints
    const key = `${userId}:${method}:${path}`;

    // Optional debug
    console.log('CACHE KEY:', key);

    return key;
  }
}

