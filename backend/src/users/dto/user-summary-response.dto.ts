import type { User } from '../entities/user.entity.js';

/**
 * The smallest public shape of a user: what a standard user sees in the list.
 * Usernames (half of a credential) and roles (who the admins are) are left
 * out, so they never reach a standard user's browser.
 */
export class UserSummaryResponseDto {
  id: string;
  fullName: string;

  static fromEntity(user: User): UserSummaryResponseDto {
    const dto = new UserSummaryResponseDto();
    dto.id = user.id;
    dto.fullName = user.fullName;
    return dto;
  }
}
