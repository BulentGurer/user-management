import type { User } from '../entities/user.entity.js';
import type { UserRole } from '../user-role.enum.js';
import { UserSummaryResponseDto } from './user-summary-response.dto.js';

/**
 * The public shape of a user. It is built field by field from the entity, so
 * the password hash can never leak into a response, even if new columns are
 * added to the entity later.
 */
export class UserResponseDto extends UserSummaryResponseDto {
  username: string;
  role: UserRole;

  static override fromEntity(user: User): UserResponseDto {
    const dto = Object.assign(
      new UserResponseDto(),
      UserSummaryResponseDto.fromEntity(user),
    );
    dto.username = user.username;
    dto.role = user.role;
    return dto;
  }
}
