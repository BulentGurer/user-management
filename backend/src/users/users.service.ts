import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../database/postgres-errors.js';
import { PasswordHasher } from '../security/password-hasher.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { User, USERNAME_UNIQUE_CONSTRAINT } from './entities/user.entity.js';
import { normalizeUsername } from './username.js';

export const USERNAME_TAKEN_MESSAGE = 'Username is already taken';

/**
 * User business logic. It works with entities; controllers map them to
 * response DTOs, so the password hash never leaves this layer.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { username: 'ASC' } });
  }

  /** For callers that handle a missing user themselves (e.g. auth). */
  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({
      username: normalizeUsername(username),
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create({
      username: normalizeUsername(dto.username),
      passwordHash: await this.passwordHasher.hash(dto.password),
      fullName: dto.fullName,
      role: dto.role,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (isUniqueViolation(error, USERNAME_UNIQUE_CONSTRAINT)) {
        throw new ConflictException(USERNAME_TAKEN_MESSAGE);
      }
      throw error;
    }
  }
}
