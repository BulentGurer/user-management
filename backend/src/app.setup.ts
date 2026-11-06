import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { EnvironmentVariables } from './config/env.validation.js';

export const API_PREFIX = 'api';
export const API_DOCS_PATH = `${API_PREFIX}/docs`;
const API_VERSION = '1.0';

/**
 * Application-wide HTTP settings. Shared by main.ts and the end-to-end tests,
 * so the tests run against exactly the same configuration.
 */
export function configureApp(app: NestExpressApplication): void {
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  // Behind a reverse proxy, the client's IP address (used by the sign-in
  // rate limit) comes from X-Forwarded-For. Only the configured number of
  // proxy hops is trusted, so a client cannot choose its own address.
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));
  // Security headers on every response, e.g. Content-Security-Policy,
  // X-Content-Type-Options and Strict-Transport-Security. The CSP would
  // normally also tell browsers to load everything over HTTPS; that is left
  // out because this setup serves plain HTTP (TLS is the job of whatever
  // terminates it in front), and it would break the Swagger UI.
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );

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
  setUpApiDocs(app);
}

/**
 * Interactive OpenAPI documentation. Field types and validation rules come
 * from the DTOs through the Swagger compiler plugin (see nest-cli.json).
 *
 * Kept public here so that reviewers can try the API. A real production
 * deployment would usually disable or protect it.
 */
function setUpApiDocs(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('User Management API')
    .setDescription(
      'Sign in with POST /api/auth/login, then click "Authorize" and paste ' +
        'the access token.',
    )
    .setVersion(API_VERSION)
    .addBearerAuth()
    .build();

  SwaggerModule.setup(API_DOCS_PATH, app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
