import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UNEXPECTED_ERROR_MESSAGE } from '../../../core/api/api-error';
import { UserDetail } from '../../../core/api/user-models';
import { UsersApi } from '../../../core/api/users-api';
import { STANDARD_USER } from '../../../core/auth/testing/auth-test-helpers';
import { USER_NOT_FOUND_MESSAGE } from '../user-load-error';
import { UserDetailPage } from './user-detail-page';

const DETAIL: UserDetail = {
  ...STANDARD_USER,
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T11:30:00.000Z',
};

describe('UserDetailPage', () => {
  let get: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<UserDetailPage>;
  let element: HTMLElement;

  beforeEach(async () => {
    get = vi.fn();
    await TestBed.configureTestingModule({
      imports: [UserDetailPage],
      providers: [provideRouter([]), { provide: UsersApi, useValue: { get } }],
    }).compileComponents();
  });

  async function render(id: string): Promise<void> {
    fixture = TestBed.createComponent(UserDetailPage);
    fixture.componentRef.setInput('id', id);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  /** The definition list as label → value pairs. */
  function details(): Record<string, string> {
    const labels = element.querySelectorAll('dt');
    return Object.fromEntries(
      Array.from(labels, (label) => [
        label.textContent?.trim() ?? '',
        label.nextElementSibling?.textContent?.trim() ?? '',
      ]),
    );
  }

  it('shows the user with both timestamps', async () => {
    get.mockReturnValue(of(DETAIL));

    await render(DETAIL.id);

    expect(get).toHaveBeenCalledWith(DETAIL.id);
    expect(element.querySelector('h1')?.textContent).toContain('Mehmet Demir');
    expect(details()).toMatchObject({
      Username: 'mehmet.demir',
      'Full name': 'Mehmet Demir',
      Role: 'user',
    });
    const times = Array.from(element.querySelectorAll('time'), (time) =>
      time.getAttribute('datetime'),
    );
    expect(times).toEqual([DETAIL.createdAt, DETAIL.updatedAt]);
  });

  it.each([404, 400])('says the user does not exist on %i', async (status) => {
    get.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));

    await render('missing');

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(USER_NOT_FOUND_MESSAGE);
    expect(element.querySelector('dl')).toBeNull();
  });

  it('shows a generic message for other errors', async () => {
    get.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    await render(DETAIL.id);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      UNEXPECTED_ERROR_MESSAGE,
    );
  });
});
