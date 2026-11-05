// The Swagger variant also marks the fields optional in the API docs.
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

/**
 * Every field is optional and, when present, follows the same rules as on
 * create. A password is hashed only when a new one is given.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
