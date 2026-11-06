import type { User } from '../entities/user.entity.js';
import { UserRole } from '../user-role.enum.js';
import { UserResponseDto } from './user-response.dto.js';
import { UserSummaryResponseDto } from './user-summary-response.dto.js';

/** One row of the user list. How much it shows depends on who is asking. */
export type UserListItemDto = UserResponseDto | UserSummaryResponseDto;

/**
 * Admins manage users, so they see usernames and roles. Standard users only
 * need to know who exists, so they get the summary. The decision is made on
 * the server: hiding columns in the browser alone would still send the data.
 */
export function toUserListItem(
  user: User,
  viewerRole: UserRole,
): UserListItemDto {
  return viewerRole === UserRole.Admin
    ? UserResponseDto.fromEntity(user)
    : UserSummaryResponseDto.fromEntity(user);
}
