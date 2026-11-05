import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/user-role.enum.js';
import type { UsersService } from '../users/users.service.js';
import type { AuthenticatedRequest } from './authenticated-request.js';
import { Public } from './decorators/public.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const SECRET = 'a'.repeat(32);
const USER: User = {
  id: '0d7a1a8e-2a8f-4a59-9b0c-3f1f6f0e8a11',
  username: 'mehmet.demir',
  passwordHash: 'stored-hash',
  fullName: 'Mehmet Demir',
  role: UserRole.User,
  createdAt: new Date(),
  updatedAt: new Date(),
};

class TestController {
  @Public()
  publicRoute(): void {}

  protectedRoute(): void {}
}

type Route = 'publicRoute' | 'protectedRoute';

function contextFor(
  route: Route,
  authorization?: string,
): { context: ExecutionContext; request: AuthenticatedRequest } {
  const request = { headers: { authorization } } as AuthenticatedRequest;
  const context = {
    // Nest reads route metadata from the handler function itself.
    getHandler: () =>
      Reflect.get(TestController.prototype, route) as () => void,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService({
    secret: SECRET,
    signOptions: { algorithm: 'HS256', expiresIn: 60 },
    verifyOptions: { algorithms: ['HS256'] },
  });
  let usersService: { findById: ReturnType<typeof vi.fn> };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    usersService = { findById: vi.fn().mockResolvedValue(USER) };
    guard = new JwtAuthGuard(
      new Reflector(),
      jwtService,
      usersService as unknown as UsersService,
    );
  });

  const validToken = () => jwtService.signAsync({ sub: USER.id });

  it('lets @Public() routes through without a token', async () => {
    const { context } = contextFor('publicRoute');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('attaches the user from the database, without the password hash', async () => {
    const { context, request } = contextFor(
      'protectedRoute',
      `Bearer ${await validToken()}`,
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(usersService.findById).toHaveBeenCalledWith(USER.id);
    expect(request.user).toEqual({
      id: USER.id,
      username: USER.username,
      fullName: USER.fullName,
      role: UserRole.User,
    });
    expect(request.user).not.toHaveProperty('passwordHash');
  });

  it.each([
    ['no Authorization header', undefined],
    ['a non-Bearer scheme', 'Basic dXNlcjpwYXNz'],
    ['an empty Bearer token', 'Bearer '],
    ['a malformed token', 'Bearer not-a-jwt'],
  ])('rejects a request with %s', async (_case, authorization) => {
    const { context } = contextFor('protectedRoute', authorization);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with another secret', async () => {
    const forged = await new JwtService({ secret: 'b'.repeat(32) }).signAsync({
      sub: USER.id,
    });
    const { context } = contextFor('protectedRoute', `Bearer ${forged}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an expired token', async () => {
    const expired = await jwtService.signAsync(
      { sub: USER.id },
      { expiresIn: -10 },
    );
    const { context } = contextFor('protectedRoute', `Bearer ${expired}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unsigned token (alg "none")', async () => {
    const encode = (part: object) =>
      Buffer.from(JSON.stringify(part)).toString('base64url');
    const unsigned = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: USER.id })}.`;
    const { context } = contextFor('protectedRoute', `Bearer ${unsigned}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token whose subject is not a user id', async () => {
    const token = await jwtService.signAsync({ sub: 'not-a-uuid' });
    const { context } = contextFor('protectedRoute', `Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usersService.findById).not.toHaveBeenCalled();
  });

  it('rejects a valid token of a user who was deleted', async () => {
    usersService.findById.mockResolvedValue(null);
    const { context } = contextFor(
      'protectedRoute',
      `Bearer ${await validToken()}`,
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
