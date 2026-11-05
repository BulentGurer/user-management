import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { User } from '../../../core/api/user-models';
import { UsersApi } from '../../../core/api/users-api';
import { AuthService } from '../../../core/auth/auth-service';
import { ADMIN, STANDARD_USER } from '../../../core/auth/testing/auth-test-helpers';
import { LOAD_ERROR_MESSAGE, UserList } from './user-list';

describe('UserList', () => {
  let list: ReturnType<typeof vi.fn<() => Observable<User[]>>>;
  let fixture: ComponentFixture<UserList>;
  let element: HTMLElement;

  beforeEach(async () => {
    list = vi.fn<() => Observable<User[]>>();
    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [
        { provide: UsersApi, useValue: { list } },
        { provide: AuthService, useValue: { currentUser: signal(STANDARD_USER) } },
      ],
    }).compileComponents();
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(UserList);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  /** The visible text of each body cell, row by row. */
  function rows(): string[][] {
    return Array.from(element.querySelectorAll('tr[mat-row]'), (row) =>
      Array.from(row.querySelectorAll('td'), (cell) =>
        (cell.textContent ?? '').replace(/\s+/g, ' ').trim(),
      ),
    );
  }

  it('shows every user in the order the server returns', async () => {
    list.mockReturnValue(of([ADMIN, STANDARD_USER]));

    await render();

    expect(rows()).toEqual([
      ['admin', 'System Admin', 'admin'],
      ['mehmet.demir (you)', 'Mehmet Demir', 'user'],
    ]);
  });

  it('marks only the signed-in user as "you"', async () => {
    list.mockReturnValue(of([ADMIN, STANDARD_USER]));

    await render();

    expect(element.querySelectorAll('.you')).toHaveLength(1);
  });

  it('shows a progress bar while loading', async () => {
    const response = new Subject<User[]>();
    list.mockReturnValue(response);
    fixture = TestBed.createComponent(UserList);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    expect(element.querySelector('mat-progress-bar')).not.toBeNull();

    response.next([ADMIN]);
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

    list.mockReturnValueOnce(of([ADMIN]));
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(rows()).toEqual([['admin', 'System Admin', 'admin']]);
  });
});
