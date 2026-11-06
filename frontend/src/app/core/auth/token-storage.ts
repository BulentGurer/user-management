import { Injectable } from '@angular/core';

/**
 * Keeps the access token between page loads. Consumers depend on this
 * abstraction; the implementation is chosen in app.config.ts, so the storage
 * (for example an httpOnly cookie set by the server) can change in one place.
 */
export abstract class TokenStorage {
  /** The token, or null when there is none or it has expired. */
  abstract read(): string | null;

  abstract save(token: string, expiresInSeconds: number): void;

  abstract clear(): void;
}

interface StoredToken {
  value: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

export const TOKEN_STORAGE_KEY = 'user-management.access-token';
const MILLISECONDS_PER_SECOND = 1000;

/**
 * localStorage survives reloads and new tabs, which keeps the app simple.
 * The trade-off: any script running on the page could read the token, so
 * the app must stay free of XSS (Angular escapes bound values by default).
 * An httpOnly cookie would avoid that, at the cost of CSRF protection.
 */
@Injectable()
export class LocalStorageTokenStorage extends TokenStorage {
  read(): string | null {
    const stored = parseStoredToken(localStorage.getItem(TOKEN_STORAGE_KEY));
    if (!stored || stored.expiresAt <= Date.now()) {
      this.clear();
      return null;
    }
    return stored.value;
  }

  save(token: string, expiresInSeconds: number): void {
    const stored: StoredToken = {
      value: token,
      expiresAt: Date.now() + expiresInSeconds * MILLISECONDS_PER_SECOND,
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(stored));
  }

  clear(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function parseStoredToken(raw: string | null): StoredToken | null {
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<StoredToken>;
    return typeof value.value === 'string' && typeof value.expiresAt === 'number'
      ? { value: value.value, expiresAt: value.expiresAt }
      : null;
  } catch {
    return null;
  }
}
