import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { SecurityModule } from '../security/security.module.js';
import { UsersModule } from '../users/users.module.js';
import { accessTokenOptions } from './access-token.options.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { loginRateLimitOptions } from './login-rate-limit.options.js';
import { RolesGuard } from './roles.guard.js';

type AppConfig = ConfigService<EnvironmentVariables, true>;

@Module({
  imports: [
    UsersModule,
    SecurityModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: AppConfig) => accessTokenOptions(config),
    }),
    // Sign-in rate limit, applied by ThrottlerGuard on the login route.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: AppConfig) => loginRateLimitOptions(config),
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
