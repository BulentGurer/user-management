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
import type { AuthenticatedUser } from '../auth/authenticated-request.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserDetailResponseDto } from './dto/user-detail-response.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UserRole } from './user-role.enum.js';
import { UsersService } from './users.service.js';

/**
 * Every route needs a signed-in user (global JwtAuthGuard). Listing is open
 * to all roles; everything else is admin only.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();
    return users.map((user) => UserResponseDto.fromEntity(user));
  }

  @Roles(UserRole.Admin)
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserDetailResponseDto> {
    return UserDetailResponseDto.fromEntity(
      await this.usersService.findOne(id),
    );
  }

  @Roles(UserRole.Admin)
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserDetailResponseDto> {
    return UserDetailResponseDto.fromEntity(
      await this.usersService.create(dto),
    );
  }

  @Roles(UserRole.Admin)
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDetailResponseDto> {
    return UserDetailResponseDto.fromEntity(
      await this.usersService.update(id, dto),
    );
  }

  @Roles(UserRole.Admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.usersService.remove(id, actor.id);
  }
}
