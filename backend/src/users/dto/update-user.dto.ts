import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto.js';

/**
 * Every field is optional and, when present, follows the same rules as on
 * create. A password is hashed only when a new one is given.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
