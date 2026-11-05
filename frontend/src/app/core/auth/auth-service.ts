import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiPaths } from '../api/api-paths';
import { LoginResponse, User, UserRole } from '../api/user-models';
import { TokenStorage } from './token-storage';

export const LOGIN_PATH = '/login';

/**
 * The signed-in user as signals. The role shown here only drives the UI
 * (which buttons and pages to show); the backend enforces every permission.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly router = inject(Router);

  private readonly user = signal<User | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === UserRole.Admin);

  async login(username: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(ApiPaths.login, { username, password }),
    );
    this.tokenStorage.save(response.accessToken, response.expiresIn);
    await this.refreshCurrentUser();
  }

  /**
   * Restores the session after a page load. A missing, expired or rejected
   * token simply leaves the user signed out.
   */
  async restoreSession(): Promise<void> {
    if (!this.tokenStorage.read()) {
      return;
    }
    try {
      await this.refreshCurrentUser();
    } catch {
      this.clearSession();
    }
  }

  /** Reloads the user from the server, e.g. after an admin changed their own role. */
  async refreshCurrentUser(): Promise<void> {
    this.user.set(await firstValueFrom(this.http.get<User>(ApiPaths.me)));
  }

  /** Ends the session and shows the login page, optionally coming back later. */
  logout(returnUrl?: string): void {
    this.clearSession();
    const queryParams = returnUrl && returnUrl !== '/' ? { returnUrl } : {};
    void this.router.navigate([LOGIN_PATH], { queryParams });
  }

  private clearSession(): void {
    this.tokenStorage.clear();
    this.user.set(null);
  }
}
