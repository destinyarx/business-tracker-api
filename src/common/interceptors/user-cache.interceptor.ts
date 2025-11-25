// src/common/interceptors/user-cache.interceptor.ts

import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const req = context.switchToHttp().getRequest();
    
    // Expect route: GET /products/user/:user
    const userId = req.params.user;

    if (!userId) return undefined;

    return `products-${userId}`; // dynamic redis key
  }
}
