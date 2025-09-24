import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { Request } from 'express';
  
  @Injectable()
  export class ClerkAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const token = this.extractTokenFromHeader(request);
  
      if (!token) {
        throw new UnauthorizedException('Missing token');
      }
  
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.SUPABASE_JWT_KEY, 
        });
  
        // attach user info to request
        request['user'] = payload;
        return true;
      } catch (err) {
        throw new UnauthorizedException(err.message);
      }
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const authHeader = request.headers['authorization'];
      if (!authHeader) return undefined;
  
      const [type, token] = authHeader.split(' ');
      return type === 'Bearer' ? token : undefined;
    }
  }
  