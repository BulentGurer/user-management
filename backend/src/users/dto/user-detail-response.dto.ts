import type { User } from '../entities/user.entity.js';
import { UserResponseDto } from './user-response.dto.js';

/**
 * The admin-only detail view. The timestamps are left out of the list that
 * every user can see, so standard users get only the data they need.
 */
export class UserDetailResponseDto extends UserResponseDto {
  createdAt: Date;
  updatedAt: Date;

  static override fromEntity(user: User): UserDetailResponseDto {
    const dto = Object.assign(
      new UserDetailResponseDto(),
      UserResponseDto.fromEntity(user),
    );
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
