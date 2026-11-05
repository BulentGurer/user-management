import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, type Repository } from 'typeorm';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import { User, USERNAME_UNIQUE_CONSTRAINT } from './entities/user.entity.js';
import { UserRole } from './user-role.enum.js';
import { USERNAME_TAKEN_MESSAGE, UsersService } from './users.service.js';

const CREATE_DTO: CreateUserDto = {
  username: 'Elif.Sahin',
  password: 'plain-password',
  fullName: 'Elif Şahin',
  role: UserRole.User,
};

function postgresError(code: string, constraint?: string): QueryFailedError {
  return new QueryFailedError('INSERT ...', [], {
    code,
    constraint,
  } as unknown as Error);
}

describe('UsersService', () => {
  let repository: {
    find: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let service: UsersService;

  beforeEach(() => {
    repository = {
      find: vi.fn().mockResolvedValue([]),
      findOneBy: vi.fn().mockResolvedValue(null),
      create: vi.fn((fields: Partial<User>) =>
        Object.assign(new User(), fields),
      ),
      save: vi.fn((user: User) => Promise.resolve(user)),
    };
    const hasher: PasswordHasher = {
      hash: (plain) => Promise.resolve(`hashed(${plain})`),
      verify: () => Promise.resolve(true),
    };
    service = new UsersService(
      repository as unknown as Repository<User>,
      hasher,
    );
  });

  describe('lookups', () => {
    it('lists users ordered by username', async () => {
      await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { username: 'ASC' },
      });
    });

    it('looks usernames up case-insensitively', async () => {
      await service.findByUsername('  Ayse.Yilmaz ');

      expect(repository.findOneBy).toHaveBeenCalledWith({
        username: 'ayse.yilmaz',
      });
    });

    it('throws 404 when a user does not exist', async () => {
      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('stores a hash of the password, never the password itself', async () => {
      const user = await service.create(CREATE_DTO);

      expect(user.passwordHash).toBe('hashed(plain-password)');
      expect(JSON.stringify(repository.save.mock.calls)).not.toContain(
        '"plain-password"',
      );
    });

    it('stores the username in lowercase', async () => {
      const user = await service.create(CREATE_DTO);

      expect(user.username).toBe('elif.sahin');
    });

    it('turns a duplicate username into 409 Conflict', async () => {
      repository.save.mockRejectedValue(
        postgresError('23505', USERNAME_UNIQUE_CONSTRAINT),
      );

      await expect(service.create(CREATE_DTO)).rejects.toThrow(
        new ConflictException(USERNAME_TAKEN_MESSAGE),
      );
    });

    it('does not hide other database errors', async () => {
      const otherError = postgresError('23514', 'CHK_users_username_lowercase');
      repository.save.mockRejectedValue(otherError);

      await expect(service.create(CREATE_DTO)).rejects.toBe(otherError);
    });
  });
});
