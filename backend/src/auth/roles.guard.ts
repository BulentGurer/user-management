import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../users/user-role.enum.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { ROLES_KEY } from './decorators/roles.decorator.js';

/**
 * Registered globally after JwtAuthGuard, so the user (with the role read
 * from the database) is already attached when this guard runs. A missing
 * role is 403 Forbidden: the caller is known but not allowed.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      UserRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
