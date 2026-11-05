import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiPaths, isApiRequest } from '../api/api-paths';
import { AuthService, LOGIN_PATH } from './auth-service';
import { TokenStorage } from './token-storage';

/**
 * Adds the bearer token to requests for our own API only, so the token never
 * reaches another host. A 401 means the session is no longer valid (expired
 * token, deleted user): the user is signed out and sent to the login page,
 * returning to the current page afterwards. The login request is excluded:
 * its 401 just means wrong credentials.
 *
 * Before the first navigation has finished (while the session is restored at
 * startup) the interceptor stays out of it: AuthService.restoreSession clears
 * the session itself and the route guard redirects with the right return
 * URL. Redirecting here as well would race with the guard and lose it.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!isApiRequest(request.url)) {
    return next(request);
  }

  const token = inject(TokenStorage).read();
  const authService = inject(AuthService);
  const router = inject(Router);

  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const sessionRejected =
        error instanceof HttpErrorResponse &&
        error.status === HttpStatusCode.Unauthorized &&
        request.url !== ApiPaths.login;

      if (sessionRejected && router.navigated && !router.url.startsWith(LOGIN_PATH)) {
        authService.logout(router.url);
      }
      return throwError(() => error);
    }),
  );
};
