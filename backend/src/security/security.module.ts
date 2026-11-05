import { Module } from '@nestjs/common';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';
import { PasswordHasher } from './password-hasher.js';

/**
 * Shared by the users and auth features. Keeping it separate from both avoids
 * a circular dependency between them.
 */
@Module({
  providers: [{ provide: PasswordHasher, useClass: Argon2PasswordHasher }],
  exports: [PasswordHasher],
})
export class SecurityModule {}
