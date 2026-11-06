import { User } from '../entities/user.entity.js';
import { UserRole } from '../user-role.enum.js';
import { toUserListItem } from './user-list-item.js';

describe('toUserListItem', () => {
  const user = Object.assign(new User(), {
    id: 'user-1',
    username: 'mehmet.demir',
    passwordHash: 'secret-hash',
    fullName: 'Mehmet Demir',
    role: UserRole.User,
    createdAt: new Date('2026-11-05T10:00:00Z'),
    updatedAt: new Date('2026-11-05T11:00:00Z'),
  });

  it('shows an admin the username and role', () => {
    expect(toUserListItem(user, UserRole.Admin)).toEqual({
      id: 'user-1',
      username: 'mehmet.demir',
      fullName: 'Mehmet Demir',
      role: UserRole.User,
    });
  });

  it('shows a standard user only the id and full name', () => {
    const item = toUserListItem(user, UserRole.User);

    expect(item).toEqual({ id: 'user-1', fullName: 'Mehmet Demir' });
    // toEqual ignores undefined fields, so check that they do not exist at all.
    expect(item).not.toHaveProperty('username');
    expect(item).not.toHaveProperty('role');
  });
});
