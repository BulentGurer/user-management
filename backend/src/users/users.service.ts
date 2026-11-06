import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, Repository } from 'typeorm';
import { isUniqueViolation } from '../database/postgres-errors.js';
import { PasswordHasher } from '../security/password-hasher.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import { User, USERNAME_UNIQUE_CONSTRAINT } from './entities/user.entity.js';
import { assertAnotherAdminRemains } from './last-admin.rule.js';
import { UserRole } from './user-role.enum.js';
import { normalizeUsername } from './username.js';

export const USERNAME_TAKEN_MESSAGE = 'Username is already taken';
export const USER_NOT_FOUND_MESSAGE = 'User not found';
export const CANNOT_DELETE_SELF_MESSAGE = 'You cannot delete your own account';

/**
 * User business logic. It works with entities; controllers map them to
 * response DTOs, so the password hash never leaves this layer.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
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
      throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
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
      throw this.translateWriteError(error);
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    // Hashed before the transaction, so the row locks are not held while the
    // (deliberately slow) hash is computed.
    const newPasswordHash =
      dto.password === undefined
        ? undefined
        : await this.passwordHasher.hash(dto.password);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const adminIds = await this.lockAdminIds(manager);
        const user = await this.findAndLock(manager, id);

        if (losesAdminRole(user, dto)) {
          assertAnotherAdminRemains(adminIds, user.id);
        }
        applyChanges(user, dto, newPasswordHash);
        return manager.save(user);
      });
    } catch (error) {
      throw this.translateWriteError(error);
    }
  }

  async remove(id: string, actorId: string): Promise<void> {
    if (id === actorId) {
      throw new ForbiddenException(CANNOT_DELETE_SELF_MESSAGE);
    }

    await this.dataSource.transaction(async (manager) => {
      const adminIds = await this.lockAdminIds(manager);
      const user = await this.findAndLock(manager, id);

      if (user.role === UserRole.Admin) {
        assertAnotherAdminRemains(adminIds, user.id);
      }
      await manager.delete(User, { id: user.id });
    });
  }

  /**
   * Locks every admin row until the transaction ends (SELECT ... FOR UPDATE)
   * and returns their ids. A concurrent request that wants to remove an
   * admin waits here, then sees the committed result, so two admins cannot
   * demote or delete each other at the same time and leave no admin.
   *
   * Rows are locked in id order, and always before the target row, so two
   * transactions never wait for each other in a cycle (no deadlock).
   */
  private async lockAdminIds(manager: EntityManager): Promise<string[]> {
    const admins = await manager
      .createQueryBuilder(User, 'user')
      .select('user.id')
      .where('user.role = :role', { role: UserRole.Admin })
      .orderBy('user.id')
      .setLock('pessimistic_write')
      .getMany();
    return admins.map((admin) => admin.id);
  }

  private async findAndLock(manager: EntityManager, id: string): Promise<User> {
    const user = await manager.findOne(User, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    }
    return user;
  }

  /** Maps known database errors to HTTP errors; anything else is unchanged. */
  private translateWriteError(error: unknown): unknown {
    if (isUniqueViolation(error, USERNAME_UNIQUE_CONSTRAINT)) {
      return new ConflictException(USERNAME_TAKEN_MESSAGE);
    }
    return error;
  }
}

function losesAdminRole(user: User, dto: UpdateUserDto): boolean {
  return (
    user.role === UserRole.Admin &&
    dto.role !== undefined &&
    dto.role !== UserRole.Admin
  );
}

/** Copies only the fields that were sent; the password arrives already hashed. */
function applyChanges(
  user: User,
  dto: UpdateUserDto,
  newPasswordHash: string | undefined,
): void {
  if (dto.username !== undefined) {
    user.username = normalizeUsername(dto.username);
  }
  if (dto.fullName !== undefined) {
    user.fullName = dto.fullName;
  }
  if (dto.role !== undefined) {
    user.role = dto.role;
  }
  if (newPasswordHash !== undefined) {
    user.passwordHash = newPasswordHash;
  }
}
