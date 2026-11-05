import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth-interceptor';
import { AuthService } from './core/auth/auth-service';
import { LocalStorageTokenStorage, TokenStorage } from './core/auth/token-storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: TokenStorage, useClass: LocalStorageTokenStorage },
    // Restore the session before the first navigation, so guards already
    // know who is signed in after a page reload.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};
