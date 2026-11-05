import { User, UserRole } from '../../api/user-models';
import { TokenStorage } from '../token-storage';

/** Keeps the token in memory, so tests do not depend on localStorage or time. */
export class InMemoryTokenStorage extends TokenStorage {
  token: string | null = null;

  read(): string | null {
    return this.token;
  }

  save(token: string): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
  }
}

export const ADMIN: User = {
  id: '7d34f366-81fa-4e28-9dcd-87d17a4a5dce',
  username: 'admin',
  fullName: 'System Admin',
  role: UserRole.Admin,
};

export const STANDARD_USER: User = {
  id: 'd4468d2d-b042-4cd9-b8c0-82f44e4d97c1',
  username: 'mehmet.demir',
  fullName: 'Mehmet Demir',
  role: UserRole.User,
};
