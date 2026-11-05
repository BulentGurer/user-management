import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
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
}
