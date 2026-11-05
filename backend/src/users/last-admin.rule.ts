import { ConflictException } from '@nestjs/common';

export const LAST_ADMIN_MESSAGE = 'At least one admin must remain';

/**
 * The system must always keep at least one admin. Call this before an admin
 * is deleted or loses the admin role.
 *
 * `adminIds` must come from rows locked inside the same transaction as the
 * write; otherwise two concurrent requests could each see another admin and
 * both remove one.
 */
export function assertAnotherAdminRemains(
  adminIds: readonly string[],
  removedAdminId: string,
): void {
  const remainingAdmins = adminIds.filter((id) => id !== removedAdminId);
  if (remainingAdmins.length === 0) {
    throw new ConflictException(LAST_ADMIN_MESSAGE);
  }
}
