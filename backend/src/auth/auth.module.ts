import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { durationToSeconds } from '../config/duration.js';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { SecurityModule } from '../security/security.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

/** HMAC with SHA-256, pinned on both sides so no other algorithm is accepted. */
const JWT_ALGORITHM = 'HS256';
const MILLISECONDS_PER_SECOND = 1000;

export const TOO_MANY_LOGIN_ATTEMPTS_MESSAGE =
  'Too many sign-in attempts. Please wait a moment and try again.';

@Module({
  imports: [
    UsersModule,
    SecurityModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: JWT_ALGORITHM,
          expiresIn: durationToSeconds(
            config.get('JWT_EXPIRES_IN', { infer: true }),
          ),
        },
        verifyOptions: { algorithms: [JWT_ALGORITHM] },
      }),
    }),
    // Counts requests per client IP address. Applied only where
    // ThrottlerGuard is used: the sign-in route (see AuthController).
    // In memory, which is enough for one API instance; several instances
    // would share a store such as Redis.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        throttlers: [
          {
            limit: config.get('LOGIN_RATE_LIMIT', { infer: true }),
            ttl:
              durationToSeconds(
                config.get('LOGIN_RATE_LIMIT_WINDOW', { infer: true }),
              ) * MILLISECONDS_PER_SECOND,
          },
        ],
        errorMessage: TOO_MANY_LOGIN_ATTEMPTS_MESSAGE,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Global guards run in the order they are registered: first authenticate
    // (who is calling?), then authorize (may they do this?).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
