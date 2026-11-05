import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheckService,
  type HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator.js';

const DATABASE_TIMEOUT_MS = 1500;

type ComponentStatus = Record<string, { status: string }>;

export interface HealthResponse {
  status: 'ok' | 'error';
  components: ComponentStatus;
}

/**
 * Used by the Docker Compose healthcheck and by monitoring. The API counts as
 * healthy only if it can reach the database; otherwise it answers 503.
 *
 * The endpoint is public, so it reports only up/down per component. Error
 * details (hosts, ports, driver messages) stay in the server log, where
 * Terminus writes them.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: 'All components are up' })
  @ApiServiceUnavailableResponse({ description: 'A component is down' })
  async check(): Promise<HealthResponse> {
    try {
      const result = await this.health.check([
        () =>
          this.database.pingCheck('database').withTimeout(DATABASE_TIMEOUT_MS),
      ]);
      return { status: 'ok', components: statusesOnly(result.details) };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        const { details } = error.getResponse() as {
          details: HealthIndicatorResult;
        };
        throw new ServiceUnavailableException({
          status: 'error',
          components: statusesOnly(details),
        } satisfies HealthResponse);
      }
      throw error;
    }
  }
}

function statusesOnly(details: HealthIndicatorResult): ComponentStatus {
  return Object.fromEntries(
    Object.entries(details).map(([name, { status }]) => [name, { status }]),
  );
}
