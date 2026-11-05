import { ServiceUnavailableException } from '@nestjs/common';
import type {
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from './health.controller.js';

const INTERNAL_ERROR = 'connect ECONNREFUSED 10.0.0.5:5432';

function controllerWith(check: () => Promise<unknown>): HealthController {
  const health = { check } as unknown as HealthCheckService;
  return new HealthController(health, {} as TypeOrmHealthIndicator);
}

describe('HealthController', () => {
  it('reports every component as up', async () => {
    const controller = controllerWith(() =>
      Promise.resolve({
        status: 'ok',
        details: { database: { status: 'up', responseTime: 3 } },
      }),
    );

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      components: { database: { status: 'up' } },
    });
  });

  it('answers 503 without leaking internal error details', async () => {
    const controller = controllerWith(() =>
      Promise.reject(
        new ServiceUnavailableException({
          status: 'error',
          details: { database: { status: 'down', message: INTERNAL_ERROR } },
        }),
      ),
    );

    const error = (await controller.check().catch((e: unknown) => e)) as
      ServiceUnavailableException | undefined;

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(error?.getResponse()).toEqual({
      status: 'error',
      components: { database: { status: 'down' } },
    });
    expect(JSON.stringify(error?.getResponse())).not.toContain('ECONNREFUSED');
  });
});
