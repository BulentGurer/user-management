import type { User } from '../entities/user.entity.js';
import type { UserRole } from '../user-role.enum.js';

/**
 * The public shape of a user. It is built field by field from the entity, so
 * the password hash can never leak into a response, even if new columns are
 * added to the entity later.
 */
export class UserResponseDto {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.fullName = user.fullName;
    dto.role = user.role;
    return dto;
  }
}
