import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { INVALID_CREDENTIALS_MESSAGE, Login, SERVER_UNREACHABLE_MESSAGE } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let element: HTMLElement;
  let login: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    login = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Login);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  async function submitWith(username: string, password: string): Promise<void> {
    setInput('input[autocomplete="username"]', username);
    setInput('input[autocomplete="current-password"]', password);
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function setInput(selector: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('signs in and opens the user list', async () => {
    await submitWith('admin', 'secret-password');

    expect(login).toHaveBeenCalledWith('admin', 'secret-password');
    expect(navigateByUrl).toHaveBeenCalledWith('/users');
  });

  it('returns to the page the user originally asked for', async () => {
    fixture.componentRef.setInput('returnUrl', '/users/new');

    await submitWith('admin', 'secret-password');

    expect(navigateByUrl).toHaveBeenCalledWith('/users/new');
  });

  it.each(['https://evil.example', '//evil.example'])(
    'ignores a return URL that leaves the app (%s)',
    async (returnUrl) => {
      fixture.componentRef.setInput('returnUrl', returnUrl);

      await submitWith('admin', 'secret-password');

      expect(navigateByUrl).toHaveBeenCalledWith('/users');
    },
  );

  it('does not call the server when a field is empty', async () => {
    await submitWith('', '');

    expect(login).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Username is required.');
  });

  it('shows a generic message for wrong credentials', async () => {
    login.mockRejectedValue(new HttpErrorResponse({ status: 401 }));

    await submitWith('admin', 'wrong-password');

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      INVALID_CREDENTIALS_MESSAGE,
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('tells the user to retry when the server cannot be reached', async () => {
    login.mockRejectedValue(new HttpErrorResponse({ status: 0 }));

    await submitWith('admin', 'secret-password');

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      SERVER_UNREACHABLE_MESSAGE,
    );
  });
});
