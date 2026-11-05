import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiPaths } from '../api/api-paths';
import { AuthService } from './auth-service';
import { ADMIN, InMemoryTokenStorage, STANDARD_USER } from './testing/auth-test-helpers';
import { TokenStorage } from './token-storage';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let tokenStorage: InMemoryTokenStorage;

  beforeEach(() => {
    tokenStorage = new InMemoryTokenStorage();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TokenStorage, useValue: tokenStorage },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('stores the token and loads the user on login', async () => {
    const login = service.login('admin', 'secret-password');

    const loginRequest = http.expectOne(ApiPaths.login);
    expect(loginRequest.request.body).toEqual({ username: 'admin', password: 'secret-password' });
    loginRequest.flush({ accessToken: 'token-1', tokenType: 'Bearer', expiresIn: 3600 });
    await Promise.resolve();
    http.expectOne(ApiPaths.me).flush(ADMIN);
    await login;

    expect(tokenStorage.token).toBe('token-1');
    expect(service.currentUser()).toEqual(ADMIN);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
  });

  it('marks a standard user as not admin', async () => {
    tokenStorage.token = 'token-1';
    const restore = service.restoreSession();
    http.expectOne(ApiPaths.me).flush(STANDARD_USER);
    await restore;

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(false);
  });

  it('does not call the API when there is no stored token', async () => {
    await service.restoreSession();

    http.expectNone(ApiPaths.me);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('forgets a token that the server rejects', async () => {
    tokenStorage.token = 'stale-token';
    const restore = service.restoreSession();
    http.expectOne(ApiPaths.me).flush(null, { status: 401, statusText: 'Unauthorized' });
    await restore;

    expect(tokenStorage.token).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clears the session and goes to the login page on logout', async () => {
    tokenStorage.token = 'token-1';
    const restore = service.restoreSession();
    http.expectOne(ApiPaths.me).flush(ADMIN);
    await restore;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    service.logout('/users');

    expect(tokenStorage.token).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/users' } });
  });
});
