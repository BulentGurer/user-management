import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/authenticated-request.js';
import { AdminOnly } from '../auth/decorators/admin-only.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserDetailResponseDto } from './dto/user-detail-response.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';

const INVALID_INPUT = 'Invalid id or request body';
const USER_NOT_FOUND = 'No user with this id';

/**
 * Every route needs a signed-in user (global JwtAuthGuard). Listing is open
 * to all roles; everything else is admin only.
 */
@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Lists all users, ordered by username. Open to every signed-in user. */
  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map((user) => UserResponseDto.fromEntity(user));
  }

  /** One user, including when it was created and last updated. */
  @AdminOnly()
  @Get(':id')
  @ApiBadRequestResponse({ description: INVALID_INPUT })
  @ApiNotFoundResponse({ description: USER_NOT_FOUND })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserDetailResponseDto> {
    return UserDetailResponseDto.fromEntity(
      await this.usersService.findOne(id),
    );
  }

  @AdminOnly()
  @Post()
  @ApiBadRequestResponse({ description: INVALID_INPUT })
  @ApiConflictResponse({ description: 'Username is already taken' })
  async create(@Body() dto: CreateUserDto): Promise<UserDetailResponseDto> {
    return UserDetailResponseDto.fromEntity(
      await this.usersService.create(dto),
    );
  }

  /** Changes only the given fields. The last admin cannot be demoted. */
  @AdminOnly()
  @Patch(':id')
  @ApiBadRequestResponse({ description: INVALID_INPUT })
  @ApiNotFoundResponse({ description: USER_NOT_FOUND })
  @ApiConflictResponse({
    description: 'Username is already taken, or this is the last admin',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDetailResponseDto> {
    return UserDetailResponseDto.fromEntity(
      await this.usersService.update(id, dto),
    );
  }

  /** Deletes permanently. Admins cannot delete themselves or the last admin. */
  @AdminOnly()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiBadRequestResponse({ description: INVALID_INPUT })
  @ApiForbiddenResponse({
    description: 'The caller is not an admin, or is deleting themselves',
  })
  @ApiNotFoundResponse({ description: USER_NOT_FOUND })
  @ApiConflictResponse({ description: 'This is the last admin' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.usersService.remove(id, actor.id);
  }
}
