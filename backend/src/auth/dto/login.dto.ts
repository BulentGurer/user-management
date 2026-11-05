import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '../../users/user.constraints.js';

/**
 * Only presence and maximum length are checked here. The username and
 * password rules are not repeated, so a login attempt reveals nothing about
 * them; anything that does not match simply fails as invalid credentials.
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(USERNAME_MAX_LENGTH)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
