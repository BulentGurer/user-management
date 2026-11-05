import { TestBed } from '@angular/core/testing';
import { UserRole } from '../../core/api/user-models';
import { RoleBadge } from './role-badge';

describe('RoleBadge', () => {
  function render(role: UserRole): HTMLElement {
    const fixture = TestBed.createComponent(RoleBadge);
    fixture.componentRef.setInput('role', role);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('highlights the admin role', () => {
    const badge = render(UserRole.Admin);

    expect(badge.textContent).toBe('admin');
    expect(badge.classList).toContain('admin');
  });

  it('shows the standard role without the accent', () => {
    const badge = render(UserRole.User);

    expect(badge.textContent).toBe('user');
    expect(badge.classList).not.toContain('admin');
  });
});
