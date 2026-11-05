import { randomUUID } from 'node:crypto';
import {
  Injectable,
  type OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { durationToSeconds } from '../config/duration.js';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { PasswordHasher } from '../security/password-hasher.js';
import { UsersService } from '../users/users.service.js';
import type { AccessTokenPayload } from './authenticated-request.js';
import { LoginResponseDto } from './dto/login-response.dto.js';

/** The same message for every failure, so it never reveals which part was wrong. */
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly accessTokenTtlSeconds: number;
  /**
   * Verified against when the username does not exist, so that an unknown
   * username takes as long as a wrong password. Otherwise response times
   * would reveal which usernames exist (user enumeration).
   */
  private dummyPasswordHash: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.accessTokenTtlSeconds = durationToSeconds(
      config.get('JWT_EXPIRES_IN', { infer: true }),
    );
  }

  async onModuleInit(): Promise<void> {
    // Created with the real hasher, so it always uses the current parameters.
    this.dummyPasswordHash = await this.passwordHasher.hash(randomUUID());
  }

  async login(username: string, password: string): Promise<LoginResponseDto> {
    const user = await this.usersService.findByUsername(username);
    const passwordMatches = await this.passwordHasher.verify(
      user?.passwordHash ?? this.dummyPasswordHash,
      password,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const payload: AccessTokenPayload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);
    return new LoginResponseDto(accessToken, this.accessTokenTtlSeconds);
  }
}
