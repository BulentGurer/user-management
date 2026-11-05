import {
  createParamDecorator,
  type ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../authenticated-request.js';

/** Injects the user that JwtAuthGuard attached to the current request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      // Only reachable if the decorator is used on a @Public() route.
      throw new InternalServerErrorException('No authenticated user');
    }
    return user;
  },
);
