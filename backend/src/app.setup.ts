import { type INestApplication, ValidationPipe } from '@nestjs/common';

export const API_PREFIX = 'api';

/**
 * Application-wide HTTP settings. Shared by main.ts and the end-to-end tests,
 * so the tests run against exactly the same configuration.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties without validation decorators...
      whitelist: true,
      // ...and reject the request instead of silently ignoring them.
      forbidNonWhitelisted: true,
      // Turn plain JSON into DTO class instances (and route params into the
      // declared types).
      transform: true,
    }),
  );
}
