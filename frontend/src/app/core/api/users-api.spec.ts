import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ADMIN, STANDARD_USER } from '../auth/testing/auth-test-helpers';
import { ApiPaths } from './api-paths';
import { CreateUserRequest, UserDetail, UserRole } from './user-models';
import { UsersApi } from './users-api';

const DETAIL: UserDetail = {
  ...STANDARD_USER,
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T11:00:00.000Z',
};

describe('UsersApi', () => {
  let api: UsersApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UsersApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('lists users', async () => {
    const users = firstValueFrom(api.list());

    const request = http.expectOne(ApiPaths.users);
    expect(request.request.method).toBe('GET');
    request.flush([ADMIN, STANDARD_USER]);

    expect(await users).toEqual([ADMIN, STANDARD_USER]);
  });

  it('gets one user', async () => {
    const user = firstValueFrom(api.get(DETAIL.id));

    const request = http.expectOne(ApiPaths.user(DETAIL.id));
    expect(request.request.method).toBe('GET');
    request.flush(DETAIL);

    expect(await user).toEqual(DETAIL);
  });

  it('creates a user', async () => {
    const body: CreateUserRequest = {
      username: 'elif.sahin',
      password: 'long-enough',
      fullName: 'Elif Şahin',
      role: UserRole.User,
    };
    const created = firstValueFrom(api.create(body));

    const request = http.expectOne(ApiPaths.users);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(DETAIL);

    expect(await created).toEqual(DETAIL);
  });

  it('sends only the given fields on update', async () => {
    const updated = firstValueFrom(api.update(DETAIL.id, { role: UserRole.Admin }));

    const request = http.expectOne(ApiPaths.user(DETAIL.id));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ role: UserRole.Admin });
    request.flush(DETAIL);

    expect(await updated).toEqual(DETAIL);
  });

  it('deletes a user', async () => {
    const deleted = firstValueFrom(api.delete(DETAIL.id));

    const request = http.expectOne(ApiPaths.user(DETAIL.id));
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    await expect(deleted).resolves.toBeNull();
  });
});
