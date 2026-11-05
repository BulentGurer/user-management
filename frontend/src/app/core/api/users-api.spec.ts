import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ADMIN, STANDARD_USER } from '../auth/testing/auth-test-helpers';
import { ApiPaths } from './api-paths';
import { UsersApi } from './users-api';

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
});
