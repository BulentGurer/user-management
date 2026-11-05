import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../user-role.enum.js';
import {
  FULL_NAME_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '../user.constraints.js';

/** Referenced by name to recognize duplicate usernames (409 Conflict). */
export const USERNAME_UNIQUE_CONSTRAINT = 'UQ_users_username';

@Entity({ name: 'users' })
// Usernames are unique case-insensitively. The application stores them in
// lowercase; the database guarantees it, so a bug cannot create "Admin"
// next to "admin". Constraints are named so that errors are readable and the
// application can recognize a duplicate username.
@Unique(USERNAME_UNIQUE_CONSTRAINT, ['username'])
@Check('CHK_users_username_lowercase', `"username" = lower("username")`)
export class User {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_users' })
  id: string;

  @Column({ type: 'varchar', length: USERNAME_MAX_LENGTH })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'full_name', type: 'varchar', length: FULL_NAME_MAX_LENGTH })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.User,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
