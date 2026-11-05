import { UserRole } from '../../users/user-role.enum.js';

export interface DemoUser {
  readonly username: string;
  readonly fullName: string;
  readonly role: UserRole;
}

/**
 * Demo accounts for local runs and reviews. Two admins, so that the
 * "last admin" rule can be tried out. They all share SEED_DEMO_PASSWORD.
 */
export const DEMO_USERS: readonly DemoUser[] = [
  { username: 'admin', fullName: 'System Admin', role: UserRole.Admin },
  { username: 'ayse.yilmaz', fullName: 'Ayşe Yılmaz', role: UserRole.Admin },
  { username: 'mehmet.demir', fullName: 'Mehmet Demir', role: UserRole.User },
  { username: 'zeynep.kaya', fullName: 'Zeynep Kaya', role: UserRole.User },
  { username: 'can.ozturk', fullName: 'Can Öztürk', role: UserRole.User },
];
