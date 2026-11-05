import { Transform } from 'class-transformer';
import { IsEnum, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../user-role.enum.js';
import {
  FULL_NAME_MAX_LENGTH,
  FULL_NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../user.constraints.js';
import {
  toNormalizedUsername,
  toTrimmedString,
} from './user-field.transforms.js';

export class CreateUserDto {
  /** Trimmed and lowercased before it is validated and stored. */
  @Transform(toNormalizedUsername)
  @IsString()
  @Length(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH)
  @Matches(USERNAME_PATTERN, {
    message:
      'username may contain only letters, digits, dots, underscores and hyphens',
  })
  username: string;

  /** Required: there is no default password. Never trimmed. */
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  password: string;

  @Transform(toTrimmedString)
  @IsString()
  @Length(FULL_NAME_MIN_LENGTH, FULL_NAME_MAX_LENGTH)
  fullName: string;

  @IsEnum(UserRole)
  role: UserRole;
}
