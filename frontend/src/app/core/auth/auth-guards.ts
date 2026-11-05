import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, LOGIN_PATH } from './auth-service';

/** Where signed-in users land, and where non-admins are sent back to. */
export const HOME_PATH = '/users';

/** Only signed-in users; others go to the login page and come back afterwards. */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated()
    ? true
    : router.createUrlTree([LOGIN_PATH], { queryParams: { returnUrl: state.url } });
};

/**
 * Only admins. This hides admin pages from standard users; the backend still
 * rejects their requests on its own (403).
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAdmin() ? true : router.createUrlTree([HOME_PATH]);
};

/** The login page is pointless once signed in. */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated() ? router.createUrlTree([HOME_PATH]) : true;
};
