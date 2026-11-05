import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { EnvironmentVariables } from './config/env.validation.js';

const API_PREFIX = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
