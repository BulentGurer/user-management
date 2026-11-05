import { ConflictException } from '@nestjs/common';
import {
  assertAnotherAdminRemains,
  LAST_ADMIN_MESSAGE,
} from './last-admin.rule.js';

describe('assertAnotherAdminRemains', () => {
  it('allows removing an admin when another admin remains', () => {
    expect(() =>
      assertAnotherAdminRemains(['admin-1', 'admin-2'], 'admin-1'),
    ).not.toThrow();
  });

  it('rejects removing the last admin', () => {
    expect(() => assertAnotherAdminRemains(['admin-1'], 'admin-1')).toThrow(
      new ConflictException(LAST_ADMIN_MESSAGE),
    );
  });

  it('rejects when no admin rows were found at all', () => {
    expect(() => assertAnotherAdminRemains([], 'admin-1')).toThrow(
      ConflictException,
    );
  });
});
