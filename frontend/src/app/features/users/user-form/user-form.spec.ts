import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserDetail, UserRole } from '../../../core/api/user-models';
import { UsersApi } from '../../../core/api/users-api';
import { AuthService } from '../../../core/auth/auth-service';
import { ADMIN, STANDARD_USER } from '../../../core/auth/testing/auth-test-helpers';
import { USER_NOT_FOUND_MESSAGE } from '../user-load-error';
import { UserForm } from './user-form';

const TIMESTAMPS = {
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T11:00:00.000Z',
};
const MEHMET: UserDetail = { ...STANDARD_USER, ...TIMESTAMPS };

describe('UserForm', () => {
  let usersApi: {
    get: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let isAdmin: ReturnType<typeof signal<boolean>>;
  let refreshCurrentUser: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<UserForm>;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    usersApi = { get: vi.fn(), create: vi.fn(), update: vi.fn() };
    isAdmin = signal(true);
    refreshCurrentUser = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [UserForm],
      providers: [
        provideRouter([]),
        { provide: UsersApi, useValue: usersApi },
        {
          provide: AuthService,
          useValue: { currentUser: signal(ADMIN), isAdmin, refreshCurrentUser },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  /** Renders the form; with an id it is in edit mode, as on /users/:id/edit. */
  async function render(id?: string): Promise<void> {
    fixture = TestBed.createComponent(UserForm);
    if (id !== undefined) {
      fixture.componentRef.setInput('id', id);
    }
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  function input(name: string): HTMLInputElement {
    return element.querySelector<HTMLInputElement>(`input[formcontrolname="${name}"]`)!;
  }

  function type(name: string, value: string): void {
    input(name).value = value;
    input(name).dispatchEvent(new Event('input'));
  }

  async function chooseRole(label: string): Promise<void> {
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness);
    await select.open();
    await select.clickOptions({ text: label });
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function alertText(): string | undefined {
    return element.querySelector('[role="alert"]')?.textContent?.trim();
  }

  describe('creating a user', () => {
    it('requires a password', async () => {
      await render();
      type('username', 'elif.sahin');
      type('fullName', 'Elif Şahin');

      await submit();

      expect(usersApi.create).not.toHaveBeenCalled();
      expect(element.textContent).toContain('Password is required.');
    });

    it('creates the user and opens their details', async () => {
      usersApi.create.mockReturnValue(of({ ...MEHMET, id: 'new-id' }));
      await render();
      type('username', 'elif.sahin');
      type('fullName', 'Elif Şahin');
      type('password', 'long-enough');
      await chooseRole('Admin');

      await submit();

      expect(usersApi.create).toHaveBeenCalledWith({
        username: 'elif.sahin',
        fullName: 'Elif Şahin',
        password: 'long-enough',
        role: UserRole.Admin,
      });
      expect(navigate).toHaveBeenCalledWith(['/users', 'new-id']);
    });

    it("shows the server's reason when saving fails", async () => {
      usersApi.create.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({ status: 409, error: { message: 'Username is already taken' } }),
        ),
      );
      await render();
      type('username', 'admin');
      type('fullName', 'Another Admin');
      type('password', 'long-enough');

      await submit();

      expect(alertText()).toBe('Username is already taken.');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('rejects a username with spaces before calling the server', async () => {
      await render();
      type('username', 'elif sahin');
      type('fullName', 'Elif Şahin');
      type('password', 'long-enough');

      await submit();

      expect(usersApi.create).not.toHaveBeenCalled();
      expect(element.textContent).toContain('Use only letters, digits, dots, underscores');
    });
  });

  describe('editing a user', () => {
    it('fills the form with the current values', async () => {
      usersApi.get.mockReturnValue(of(MEHMET));

      await render(MEHMET.id);

      expect(usersApi.get).toHaveBeenCalledWith(MEHMET.id);
      expect(input('username').value).toBe('mehmet.demir');
      expect(input('fullName').value).toBe('Mehmet Demir');
      expect(input('password').value).toBe('');
    });

    it('keeps the current password when the field is left blank', async () => {
      usersApi.get.mockReturnValue(of(MEHMET));
      usersApi.update.mockReturnValue(of(MEHMET));
      await render(MEHMET.id);
      type('fullName', 'Mehmet Can Demir');

      await submit();

      expect(usersApi.update).toHaveBeenCalledWith(MEHMET.id, {
        username: 'mehmet.demir',
        fullName: 'Mehmet Can Demir',
        role: UserRole.User,
      });
      expect(navigate).toHaveBeenCalledWith(['/users', MEHMET.id]);
    });

    it('sends a new password when one is typed', async () => {
      usersApi.get.mockReturnValue(of(MEHMET));
      usersApi.update.mockReturnValue(of(MEHMET));
      await render(MEHMET.id);
      type('password', 'a-new-password');

      await submit();

      expect(usersApi.update).toHaveBeenCalledWith(
        MEHMET.id,
        expect.objectContaining({ password: 'a-new-password' }),
      );
    });

    it('sends admins who removed their own admin role back to the list', async () => {
      const self: UserDetail = { ...ADMIN, ...TIMESTAMPS };
      usersApi.get.mockReturnValue(of(self));
      usersApi.update.mockReturnValue(of({ ...self, role: UserRole.User }));
      refreshCurrentUser.mockImplementation(async () => isAdmin.set(false));
      await render(self.id);
      await chooseRole('Standard user');

      await submit();

      expect(refreshCurrentUser).toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/users');
      expect(navigate).not.toHaveBeenCalled();
    });

    it('says so when the user does not exist', async () => {
      usersApi.get.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      await render('missing');

      expect(alertText()).toBe(USER_NOT_FOUND_MESSAGE);
      expect(element.querySelector('form')).toBeNull();
    });
  });
});
