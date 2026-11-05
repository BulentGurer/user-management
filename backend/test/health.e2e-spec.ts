import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app.js';

describe('Health and API docs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports the database as up, without a token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      components: { database: { status: 'up' } },
    });
  });

  it('serves the OpenAPI document with every route', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const paths = Object.keys((response.body as { paths: object }).paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/auth/login',
        '/api/auth/me',
        '/api/users',
        '/api/users/{id}',
        '/api/health',
      ]),
    );
  });
});
