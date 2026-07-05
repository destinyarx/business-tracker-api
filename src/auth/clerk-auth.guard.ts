import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
// import * as jwt from 'jsonwebtoken';
import { verifyToken } from '@clerk/backend';
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    console.log("token: ",token)

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,

        // allowed frontend url
        authorizedParties: [
          'http://localhost:3000',
          'https://business-tracker-eta.vercel.app',
          'https://business-tracker.jeremy-dev.me',
        ],
      });

      req['user'] = payload;
      return true;
    } catch (err: any) {
      console.error('Clerk JWT verification failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // try {
    //   const payload = jwt.verify(
    //     token,
    //     process.env.SUPABASE_JWT_KEY!,
    //     { algorithms: ['HS256'] }
    //   );

    //   req['user'] = payload;
    //   return true;
    // } catch (err: any) {
    //   console.error('JWT verification failed:', err.message);
    //   throw new UnauthorizedException('Invalid or expired token');
    // }
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
