import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1793913011724 implements MigrationInterface {
  name = 'CreateUsersTable1793913011724';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."user_role" AS ENUM('admin', 'user')
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "username" character varying(32) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "full_name" character varying(100) NOT NULL,
        "role" "public"."user_role" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "CHK_users_username_lowercase" CHECK ("username" = lower("username")),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
  }
}
