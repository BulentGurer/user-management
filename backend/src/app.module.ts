import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation.js';

// One .env file at the repository root is shared with docker compose.
// The path is relative to the working directory (backend/). In containers
// the file does not exist and the values come from real environment
// variables, which always take precedence over the file.
const ENV_FILE_PATH = '../.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV_FILE_PATH,
      validate: validateEnv,
    }),
  ],
})
export class AppModule {}
