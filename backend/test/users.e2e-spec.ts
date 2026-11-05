import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserRole } from '../src/users/user-role.enum.js';
import {
  clearUsers,
  countAdmins,
  createTestApp,
  createUser,
  loginAs,
  type TestUser,
} from './setup/test-app.js';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let firstAdmin: TestUser;
  let secondAdmin: TestUser;
  let standardUser: TestUser;

  const http = () => request(app.getHttpServer());
  const bearer = async (user: TestUser) => `Bearer ${await loginAs(app, user)}`;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearUsers(app);
    firstAdmin = await createUser(app, 'admin', UserRole.Admin);
    secondAdmin = await createUser(app, 'ayse.yilmaz', UserRole.Admin);
    standardUser = await createUser(app, 'mehmet.demir', UserRole.User);
  });

  describe('role-based access', () => {
    it('lets a standard user list users, without timestamps', async () => {
      const response = await http()
        .get('/api/users')
        .set('Authorization', await bearer(standardUser))
        .expect(200);

      const users = response.body as Record<string, unknown>[];
      expect(users.map((user) => user.username)).toEqual([
        'admin',
        'ayse.yilmaz',
        'mehmet.demir',
      ]);
      expect(users[0]).not.toHaveProperty('createdAt');
      expect(users[0]).not.toHaveProperty('passwordHash');
    });

    it('forbids every admin-only route to a standard user', async () => {
      const auth = await bearer(standardUser);
      const target = `/api/users/${secondAdmin.id}`;

      await http().get(target).set('Authorization', auth).expect(403);
      await http()
        .post('/api/users')
        .set('Authorization', auth)
        .send({
          username: 'new.user',
          password: 'New.Pass.123',
          fullName: 'New User',
          role: UserRole.User,
        })
        .expect(403);
      await http()
        .patch(target)
        .set('Authorization', auth)
        .send({ role: UserRole.User })
        .expect(403);
      await http().delete(target).set('Authorization', auth).expect(403);
    });

    it('shows an admin the detail view with timestamps', async () => {
      const response = await http()
        .get(`/api/users/${standardUser.id}`)
        .set('Authorization', await bearer(firstAdmin))
        .expect(200);

      expect(response.body).toMatchObject({
        id: standardUser.id,
        username: 'mehmet.demir',
        createdAt: expect.any(String) as string,
        updatedAt: expect.any(String) as string,
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('update', () => {
    it('changes fields and replaces the password', async () => {
      await http()
        .patch(`/api/users/${standardUser.id}`)
        .set('Authorization', await bearer(firstAdmin))
        .send({ fullName: 'Mehmet Demir', password: 'Brand.New.Pass' })
        .expect(200);

      await loginAs(app, {
        username: 'mehmet.demir',
        password: 'Brand.New.Pass',
      });
      await http()
        .post('/api/auth/login')
        .send({ username: 'mehmet.demir', password: standardUser.password })
        .expect(401);
    });

    it('rejects a username that is already taken', async () => {
      await http()
        .patch(`/api/users/${standardUser.id}`)
        .set('Authorization', await bearer(firstAdmin))
        .send({ username: 'AYSE.YILMAZ' })
        .expect(409);
    });

    it('lets an admin step down while another admin remains', async () => {
      const auth = await bearer(firstAdmin);

      await http()
        .patch(`/api/users/${firstAdmin.id}`)
        .set('Authorization', auth)
        .send({ role: UserRole.User })
        .expect(200);

      // The role is read from the database on every request, so the same
      // token loses admin rights immediately.
      await http()
        .get(`/api/users/${secondAdmin.id}`)
        .set('Authorization', auth)
        .expect(403);
    });

    it('never demotes the last admin', async () => {
      const auth = await bearer(firstAdmin);
      await http()
        .patch(`/api/users/${secondAdmin.id}`)
        .set('Authorization', auth)
        .send({ role: UserRole.User })
        .expect(200);

      const response = await http()
        .patch(`/api/users/${firstAdmin.id}`)
        .set('Authorization', auth)
        .send({ role: UserRole.User })
        .expect(409);

      expect(response.body).toMatchObject({
        message: 'At least one admin must remain',
      });
      expect(await countAdmins(app)).toBe(1);
    });
  });

  describe('delete', () => {
    it('deletes a user, whose token stops working immediately', async () => {
      const userAuth = await bearer(standardUser);

      await http()
        .delete(`/api/users/${standardUser.id}`)
        .set('Authorization', await bearer(firstAdmin))
        .expect(204);

      await http().get('/api/users').set('Authorization', userAuth).expect(401);
    });

    it('forbids admins to delete their own account', async () => {
      await http()
        .delete(`/api/users/${firstAdmin.id}`)
        .set('Authorization', await bearer(firstAdmin))
        .expect(403);
    });

    it('returns 404 for a user that does not exist', async () => {
      await http()
        .delete('/api/users/00000000-0000-4000-8000-000000000000')
        .set('Authorization', await bearer(firstAdmin))
        .expect(404);
    });

    it('gives a recreated username only the new password', async () => {
      const auth = await bearer(firstAdmin);
      await http()
        .delete(`/api/users/${standardUser.id}`)
        .set('Authorization', auth)
        .expect(204);

      await http()
        .post('/api/users')
        .set('Authorization', auth)
        .send({
          username: 'mehmet.demir',
          password: 'Recreated.Pass.1',
          fullName: 'Mehmet Demir',
          role: UserRole.User,
        })
        .expect(201);

      await loginAs(app, {
        username: 'mehmet.demir',
        password: 'Recreated.Pass.1',
      });
      await http()
        .post('/api/auth/login')
        .send({ username: 'mehmet.demir', password: standardUser.password })
        .expect(401);
    });
  });

  /*
   * Two admins act against each other at the same moment. Without the row
   * lock both requests would see "another admin remains" and both succeed,
   * leaving no admin at all. With it, the second request waits, re-reads the
   * committed state and is rejected.
   */
  describe('concurrent requests', () => {
    const ROUNDS = 5;

    async function expectExactlyOneSucceeds(
      send: (actor: TestUser, target: TestUser) => Promise<request.Response>,
      successStatus: number,
    ): Promise<void> {
      for (let round = 0; round < ROUNDS; round++) {
        await clearUsers(app);
        firstAdmin = await createUser(app, 'admin', UserRole.Admin);
        secondAdmin = await createUser(app, 'ayse.yilmaz', UserRole.Admin);

        const responses = await Promise.all([
          send(firstAdmin, secondAdmin),
          send(secondAdmin, firstAdmin),
        ]);

        const successes = responses.filter(
          (response) => response.status === successStatus,
        );
        expect(successes).toHaveLength(1);
        expect(await countAdmins(app)).toBe(1);
      }
    }

    it('never lets two admins demote each other at the same time', async () => {
      await expectExactlyOneSucceeds(
        async (actor, target) =>
          http()
            .patch(`/api/users/${target.id}`)
            .set('Authorization', await bearer(actor))
            .send({ role: UserRole.User }),
        200,
      );
    });

    it('never lets two admins delete each other at the same time', async () => {
      await expectExactlyOneSucceeds(
        async (actor, target) =>
          http()
            .delete(`/api/users/${target.id}`)
            .set('Authorization', await bearer(actor)),
        204,
      );
    });
  });
});
