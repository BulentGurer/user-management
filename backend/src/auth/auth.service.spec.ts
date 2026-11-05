import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { EnvironmentVariables } from '../config/env.validation.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { User } from '../users/entities/user.entity.js';
import { UserRole } from '../users/user-role.enum.js';
import type { UsersService } from '../users/users.service.js';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth.service.js';

const DUMMY_HASH = 'dummy-hash';
const USER: User = {
  id: '0d7a1a8e-2a8f-4a59-9b0c-3f1f6f0e8a11',
  username: 'admin',
  passwordHash: 'stored-hash',
  fullName: 'System Admin',
  role: UserRole.Admin,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let usersService: { findByUsername: ReturnType<typeof vi.fn> };
  let passwordHasher: {
    hash: ReturnType<typeof vi.fn>;
    verify: ReturnType<typeof vi.fn>;
  };
  let jwtService: { signAsync: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(async () => {
    usersService = { findByUsername: vi.fn() };
    passwordHasher = {
      hash: vi.fn().mockResolvedValue(DUMMY_HASH),
      verify: vi.fn(),
    };
    jwtService = { signAsync: vi.fn().mockResolvedValue('signed-token') };
    const config = {
      get: () => '15m',
    } as unknown as ConfigService<EnvironmentVariables, true>;

    service = new AuthService(
      usersService as unknown as UsersService,
      passwordHasher as unknown as PasswordHasher,
      jwtService as unknown as JwtService,
      config,
    );
    await service.onModuleInit();
  });

  it('returns a bearer token whose only claim is the user id', async () => {
    usersService.findByUsername.mockResolvedValue(USER);
    passwordHasher.verify.mockResolvedValue(true);

    const response = await service.login('admin', 'correct-password');

    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'stored-hash',
      'correct-password',
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: USER.id });
    expect(response).toEqual({
      accessToken: 'signed-token',
      tokenType: 'Bearer',
      expiresIn: 900,
    });
  });

  it('rejects a wrong password with the generic message', async () => {
    usersService.findByUsername.mockResolvedValue(USER);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(service.login('admin', 'wrong-password')).rejects.toThrow(
      new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an unknown username with the same message', async () => {
    usersService.findByUsername.mockResolvedValue(null);
    passwordHasher.verify.mockResolvedValue(true);

    await expect(service.login('ghost', 'any-password')).rejects.toThrow(
      new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('still verifies a password for an unknown username (equal timing)', async () => {
    usersService.findByUsername.mockResolvedValue(null);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(service.login('ghost', 'any-password')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      DUMMY_HASH,
      'any-password',
    );
  });
});
