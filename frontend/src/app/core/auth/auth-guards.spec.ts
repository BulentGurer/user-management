import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './auth-guards';
import { AuthService } from './auth-service';

describe('auth guards', () => {
  const isAuthenticated = signal(false);
  const isAdmin = signal(false);

  beforeEach(() => {
    isAuthenticated.set(false);
    isAdmin.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated, isAdmin } },
      ],
    });
  });

  function run(guard: CanActivateFn, url = '/users/new'): boolean | string {
    const result = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
    return result instanceof UrlTree
      ? TestBed.inject(Router).serializeUrl(result)
      : (result as boolean);
  }

  describe('authGuard', () => {
    it('sends signed-out visitors to the login page and back afterwards', () => {
      expect(run(authGuard, '/users/new')).toBe('/login?returnUrl=%2Fusers%2Fnew');
    });

    it('lets signed-in users through', () => {
      isAuthenticated.set(true);
      expect(run(authGuard)).toBe(true);
    });
  });

  describe('adminGuard', () => {
    it('sends standard users back to the user list', () => {
      isAuthenticated.set(true);
      expect(run(adminGuard)).toBe('/users');
    });

    it('lets admins through', () => {
      isAuthenticated.set(true);
      isAdmin.set(true);
      expect(run(adminGuard)).toBe(true);
    });
  });

  describe('guestGuard', () => {
    it('shows the login page to signed-out visitors', () => {
      expect(run(guestGuard)).toBe(true);
    });

    it('sends signed-in users to the user list', () => {
      isAuthenticated.set(true);
      expect(run(guestGuard)).toBe('/users');
    });
  });
});
