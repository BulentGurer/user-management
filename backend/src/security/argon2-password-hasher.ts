import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordHasher } from './password-hasher.js';

/**
 * argon2id, the variant recommended by OWASP and RFC 9106. The parameters
 * are pinned here instead of relying on library defaults, so an upgrade
 * cannot silently change them. They are stored inside every hash string
 * ($argon2id$v=19$m=...,t=...,p=...), so existing hashes stay verifiable if
 * they are raised later.
 */
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024, // KiB, so 64 MiB
  timeCost: 3,
  parallelism: 4,
} as const;

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, HASH_OPTIONS);
  }

  async verify(passwordHash: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, plainPassword);
    } catch {
      // A malformed hash is treated as a failed match, not a server error.
      return false;
    }
  }
}
