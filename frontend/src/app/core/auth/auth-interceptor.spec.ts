import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiPaths } from '../api/api-paths';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from './auth-service';
import { InMemoryTokenStorage } from './testing/auth-test-helpers';
import { TokenStorage } from './token-storage';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let tokenStorage: InMemoryTokenStorage;
  let logout: ReturnType<typeof vi.spyOn>;
  let router: Router;

  beforeEach(() => {
    tokenStorage = new InMemoryTokenStorage();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenStorage, useValue: tokenStorage },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    logout = vi.spyOn(TestBed.inject(AuthService), 'logout').mockImplementation(() => undefined);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/users');
    router.navigated = true;
  });

  afterEach(() => {
    backend.verify();
  });

  it('adds the bearer token to API requests', () => {
    tokenStorage.token = 'token-1';

    http.get(ApiPaths.users).subscribe();

    const request = backend.expectOne(ApiPaths.users);
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-1');
    request.flush([]);
  });

  it('never sends the token to other hosts', () => {
    tokenStorage.token = 'token-1';

    http.get('https://example.com/api/users').subscribe();

    const request = backend.expectOne('https://example.com/api/users');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('sends no header when there is no token', () => {
    http.get(ApiPaths.users).subscribe();

    const request = backend.expectOne(ApiPaths.users);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('signs out and remembers the page when the session is rejected', async () => {
    tokenStorage.token = 'expired-token';
    const response = firstValueFrom(http.get(ApiPaths.users));

    backend.expectOne(ApiPaths.users).flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(logout).toHaveBeenCalledWith('/users');
  });

  it('leaves a 401 during startup to the session restore and the guards', async () => {
    router.navigated = false;
    tokenStorage.token = 'expired-token';
    const response = firstValueFrom(http.get(ApiPaths.me));

    backend.expectOne(ApiPaths.me).flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(logout).not.toHaveBeenCalled();
  });

  it('does not sign out on a failed login (wrong credentials)', async () => {
    const response = firstValueFrom(http.post(ApiPaths.login, {}));

    backend.expectOne(ApiPaths.login).flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(logout).not.toHaveBeenCalled();
  });

  it('does not sign out on other errors, such as 403', async () => {
    const response = firstValueFrom(http.delete(ApiPaths.user('some-id')));

    backend
      .expectOne(ApiPaths.user('some-id'))
      .flush(null, { status: 403, statusText: 'Forbidden' });

    await expect(response).rejects.toMatchObject({ status: 403 });
    expect(logout).not.toHaveBeenCalled();
  });
});
