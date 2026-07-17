import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

type AuthenticatedRequest = FastifyRequest & {
  user?: { sub?: string };
};

export const UserId = createParamDecorator(
  (_data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return req.user?.sub; 
  },
);
