import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UserRole } from '../user-role.enum.js';
import { CreateUserDto } from './create-user.dto.js';

const VALID = {
  username: 'elif.sahin',
  password: 'long-enough',
  fullName: 'Elif Şahin',
  role: UserRole.User,
};

/** Same steps as the global ValidationPipe: transform, then validate. */
function validate(input: Record<string, unknown>) {
  const dto = plainToInstance(CreateUserDto, input);
  const failedFields = validateSync(dto).map((error) => error.property);
  return { dto, failedFields };
}

describe('CreateUserDto', () => {
  it('accepts a valid user', () => {
    expect(validate(VALID).failedFields).toEqual([]);
  });

  it('trims and lowercases the username before validating it', () => {
    const { dto, failedFields } = validate({
      ...VALID,
      username: '  Elif.Sahin ',
    });

    expect(failedFields).toEqual([]);
    expect(dto.username).toBe('elif.sahin');
  });

  it('trims the full name but never the password', () => {
    const { dto } = validate({
      ...VALID,
      fullName: '  Elif Şahin  ',
      password: ' spaced password ',
    });

    expect(dto.fullName).toBe('Elif Şahin');
    expect(dto.password).toBe(' spaced password ');
  });

  it.each([
    ['too short', 'ab'],
    ['too long', 'a'.repeat(33)],
    ['with a space', 'elif sahin'],
    ['with a special character', 'elif@sahin'],
    ['not a string', 42],
  ])('rejects a username that is %s', (_case, username) => {
    expect(validate({ ...VALID, username }).failedFields).toEqual(['username']);
  });

  it.each([
    ['missing', undefined],
    ['shorter than 8 characters', 'short'],
    ['longer than 128 characters', 'a'.repeat(129)],
  ])('rejects a password that is %s', (_case, password) => {
    expect(validate({ ...VALID, password }).failedFields).toEqual(['password']);
  });

  it.each([
    ['too short', 'E'],
    ['only spaces', '     '],
    ['too long', 'E'.repeat(101)],
  ])('rejects a full name that is %s', (_case, fullName) => {
    expect(validate({ ...VALID, fullName }).failedFields).toEqual(['fullName']);
  });

  it('rejects an unknown role', () => {
    expect(validate({ ...VALID, role: 'superuser' }).failedFields).toEqual([
      'role',
    ]);
  });
});
