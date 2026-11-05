import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user-role.enum.js';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './authenticated-request.js';
import { Roles } from './decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class TestController {
  openRoute(): void {}

  @Roles(UserRole.Admin)
  adminRoute(): void {}
}

type Route = 'openRoute' | 'adminRoute';

function contextFor(route: Route, user?: AuthenticatedUser): ExecutionContext {
  const request = { user } as AuthenticatedRequest;
  return {
    getHandler: () =>
      Reflect.get(TestController.prototype, route) as () => void,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function userWithRole(role: UserRole): AuthenticatedUser {
  return {
    id: '0d7a1a8e-2a8f-4a59-9b0c-3f1f6f0e8a11',
    username: 'someone',
    fullName: 'Some One',
    role,
  };
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows any authenticated user on a route without @Roles', () => {
    const context = contextFor('openRoute', userWithRole(UserRole.User));

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows an admin on an admin route', () => {
    const context = contextFor('adminRoute', userWithRole(UserRole.Admin));

    expect(guard.canActivate(context)).toBe(true);
  });

  it('forbids a standard user on an admin route', () => {
    const context = contextFor('adminRoute', userWithRole(UserRole.User));

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('forbids an admin route when no user is attached', () => {
    const context = contextFor('adminRoute');

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
