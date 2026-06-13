import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = jwt.verify(
        token,
        process.env.SUPABASE_JWT_KEY!,
        { algorithms: ['HS256'] }
      );

      req['user'] = payload;
      return true;
    } catch (err: any) {
      console.error('JWT verification failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
