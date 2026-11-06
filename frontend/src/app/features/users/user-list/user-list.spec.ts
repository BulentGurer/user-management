import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { User, UserListItem, UserSummary } from '../../../core/api/user-models';
import { UsersApi } from '../../../core/api/users-api';
import { AuthService } from '../../../core/auth/auth-service';
import { ADMIN, STANDARD_USER } from '../../../core/auth/testing/auth-test-helpers';
import { ConfirmDialogData } from '../../../shared/confirm-dialog/confirm-dialog';
import { ConfirmationService } from '../../../shared/confirm-dialog/confirmation-service';
import { DELETED_MESSAGE_DURATION_MS, LOAD_ERROR_MESSAGE, UserList } from './user-list';

/** What the server sends a standard user: no usernames, no roles. */
function summaryOf({ id, fullName }: User): UserSummary {
  return { id, fullName };
}

describe('UserList', () => {
  let list: ReturnType<typeof vi.fn<() => Observable<UserListItem[]>>>;
  let deleteUser: ReturnType<typeof vi.fn<(id: string) => Observable<void>>>;
  let confirm: ReturnType<typeof vi.fn<(data: ConfirmDialogData) => Observable<boolean>>>;
  let openSnackBar: ReturnType<typeof vi.fn>;
  const currentUser = signal<User>(STANDARD_USER);
  const isAdmin = signal(false);
  let fixture: ComponentFixture<UserList>;
  let element: HTMLElement;

  beforeEach(async () => {
    list = vi.fn<() => Observable<UserListItem[]>>();
    deleteUser = vi.fn<(id: string) => Observable<void>>();
    confirm = vi.fn<(data: ConfirmDialogData) => Observable<boolean>>();
    openSnackBar = vi.fn();
    currentUser.set(STANDARD_USER);
    isAdmin.set(false);
    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [
        provideRouter([]),
        { provide: UsersApi, useValue: { list, delete: deleteUser } },
        { provide: AuthService, useValue: { currentUser, isAdmin } },
        { provide: ConfirmationService, useValue: { confirm } },
        { provide: MatSnackBar, useValue: { open: openSnackBar } },
      ],
    }).compileComponents();
  });

  function signInAsAdmin(): void {
    currentUser.set(ADMIN);
    isAdmin.set(true);
  }

  function linkHrefs(): string[] {
    return Array.from(element.querySelectorAll('a'), (link) => link.getAttribute('href') ?? '');
  }

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(UserList);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  /** The visible text of each data cell (actions left out), row by row. */
  function rows(): string[][] {
    return Array.from(element.querySelectorAll('tr[mat-row]'), (row) =>
      Array.from(row.querySelectorAll('td:not(.actions-cell)'), (cell) =>
        (cell.textContent ?? '').replace(/\s+/g, ' ').trim(),
      ),
    );
  }

  it('shows a standard user only full names, in the order the server returns', async () => {
    list.mockReturnValue(of([summaryOf(ADMIN), summaryOf(STANDARD_USER)]));

    await render();

    expect(rows()).toEqual([['System Admin'], ['Mehmet Demir (you)']]);
  });

  it('shows admins usernames, full names and roles', async () => {
    signInAsAdmin();
    list.mockReturnValue(of([ADMIN, STANDARD_USER]));

    await render();

    expect(rows()).toEqual([
      ['admin', 'System Admin (you)', 'admin'],
      ['mehmet.demir', 'Mehmet Demir', 'user'],
    ]);
  });

  it('marks only the signed-in user as "you"', async () => {
    list.mockReturnValue(of([summaryOf(ADMIN), summaryOf(STANDARD_USER)]));

    await render();

    expect(element.querySelectorAll('.you')).toHaveLength(1);
  });

  it('shows a progress bar while loading', async () => {
    const response = new Subject<UserListItem[]>();
    list.mockReturnValue(response);
    fixture = TestBed.createComponent(UserList);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    expect(element.querySelector('mat-progress-bar')).not.toBeNull();

    response.next([summaryOf(ADMIN)]);
    response.complete();
    await fixture.whenStable();

    expect(element.querySelector('mat-progress-bar')).toBeNull();
  });

  it('says so when there are no users', async () => {
    list.mockReturnValue(of([]));

    await render();

    expect(element.textContent).toContain('No users found.');
  });

  it('shows an error and loads again on retry', async () => {
    list.mockReturnValueOnce(throwError(() => new Error('Network down')));
    await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(LOAD_ERROR_MESSAGE);
    expect(element.querySelector('table')).toBeNull();

    list.mockReturnValueOnce(of([summaryOf(ADMIN)]));
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(rows()).toEqual([['System Admin']]);
  });

  it('shows no admin actions to a standard user', async () => {
    list.mockReturnValue(of([summaryOf(ADMIN), summaryOf(STANDARD_USER)]));

    await render();

    expect(linkHrefs()).toEqual([]);
    expect(element.textContent).not.toContain('New user');
  });

  it('gives admins links to create, view and edit users', async () => {
    signInAsAdmin();
    list.mockReturnValue(of([STANDARD_USER]));

    await render();

    expect(linkHrefs()).toEqual([
      '/users/new',
      `/users/${STANDARD_USER.id}`,
      `/users/${STANDARD_USER.id}/edit`,
    ]);
    expect(element.querySelector(`[aria-label="Edit ${STANDARD_USER.username}"]`)).not.toBeNull();
  });

  describe('row navigation', () => {
    let navigateByUrl: ReturnType<typeof vi.spyOn>;
    const detailUrl = `/users/${STANDARD_USER.id}`;

    beforeEach(() => {
      // Also keeps the row's own links away from real routing.
      navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    });

    function firstRow(): HTMLTableRowElement {
      return element.querySelector<HTMLTableRowElement>('tr[mat-row]')!;
    }

    it('opens the detail page when an admin clicks a row', async () => {
      signInAsAdmin();
      list.mockReturnValue(of([STANDARD_USER]));
      await render();

      firstRow().querySelector('td')!.click();

      expect(navigateByUrl).toHaveBeenCalledWith(detailUrl);
    });

    it('opens the detail page when an admin presses Enter on a focused row', async () => {
      signInAsAdmin();
      list.mockReturnValue(of([STANDARD_USER]));
      await render();

      expect(firstRow().tabIndex).toBe(0);
      firstRow().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(navigateByUrl).toHaveBeenCalledWith(detailUrl);
    });

    it('leaves clicks on the row actions to the actions themselves', async () => {
      signInAsAdmin();
      list.mockReturnValue(of([STANDARD_USER]));
      await render();

      element.querySelector<HTMLElement>(`[aria-label="Edit ${STANDARD_USER.username}"]`)!.click();

      expect(navigateByUrl).not.toHaveBeenCalledWith(detailUrl);
    });

    it('does nothing for a standard user', async () => {
      list.mockReturnValue(of([summaryOf(STANDARD_USER)]));
      await render();

      firstRow().querySelector('td')!.click();

      expect(navigateByUrl).not.toHaveBeenCalledWith(detailUrl);
      expect(firstRow().hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('delete', () => {
    const OTHER_ADMIN: User = {
      ...ADMIN,
      id: 'b1c2',
      username: 'ayse.yilmaz',
      fullName: 'Ayşe Yılmaz',
    };

    function deleteButton(user: User): HTMLButtonElement | null {
      return element.querySelector<HTMLButtonElement>(`[aria-label="Delete ${user.username}"]`);
    }

    async function clickDelete(user: User): Promise<void> {
      deleteButton(user)!.click();
      await fixture.whenStable();
    }

    beforeEach(() => {
      signInAsAdmin();
      list.mockReturnValue(of([ADMIN, OTHER_ADMIN, STANDARD_USER]));
    });

    it('offers delete on every row except the signed-in admin', async () => {
      await render();

      expect(deleteButton(ADMIN)).toBeNull();
      expect(deleteButton(OTHER_ADMIN)).not.toBeNull();
      expect(deleteButton(STANDARD_USER)).not.toBeNull();
    });

    it('asks for confirmation and deletes nothing when cancelled', async () => {
      confirm.mockReturnValue(of(false));
      await render();

      await clickDelete(STANDARD_USER);

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Mehmet Demir (mehmet.demir)') as string,
          destructive: true,
        }),
      );
      expect(deleteUser).not.toHaveBeenCalled();
    });

    it('deletes after confirmation, reloads the list and says so', async () => {
      confirm.mockReturnValue(of(true));
      deleteUser.mockReturnValue(of(undefined));
      await render();
      list.mockReturnValue(of([ADMIN, OTHER_ADMIN]));

      await clickDelete(STANDARD_USER);

      expect(deleteUser).toHaveBeenCalledWith(STANDARD_USER.id);
      expect(openSnackBar).toHaveBeenCalledWith('Mehmet Demir was deleted.', undefined, {
        duration: DELETED_MESSAGE_DURATION_MS,
      });
      expect(rows().map(([username]) => username)).toEqual(['admin', 'ayse.yilmaz']);
    });

    it("shows the server's reason when it refuses, e.g. for the last admin", async () => {
      confirm.mockReturnValue(of(true));
      deleteUser.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { message: 'At least one admin must remain' },
            }),
        ),
      );
      await render();

      await clickDelete(OTHER_ADMIN);

      expect(element.querySelector('.delete-error')?.textContent).toContain(
        'At least one admin must remain.',
      );
      expect(list).toHaveBeenCalledTimes(1);
      expect(deleteButton(OTHER_ADMIN)!.disabled).toBe(false);
    });
  });
});
