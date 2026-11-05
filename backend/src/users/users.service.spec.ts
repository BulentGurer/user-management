import type { Repository } from 'typeorm';
import type { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let repository: { findOneBy: ReturnType<typeof vi.fn> };
  let service: UsersService;

  beforeEach(() => {
    repository = { findOneBy: vi.fn().mockResolvedValue(null) };
    service = new UsersService(repository as unknown as Repository<User>);
  });

  it('finds a user by id', async () => {
    await service.findById('some-id');

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 'some-id' });
  });

  it('looks usernames up case-insensitively', async () => {
    await service.findByUsername('  Ayse.Yilmaz ');

    expect(repository.findOneBy).toHaveBeenCalledWith({
      username: 'ayse.yilmaz',
    });
  });
});
