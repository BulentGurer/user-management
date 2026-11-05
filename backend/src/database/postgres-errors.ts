import { QueryFailedError } from 'typeorm';

/** SQLSTATE code PostgreSQL uses for a unique constraint violation. */
const UNIQUE_VIOLATION = '23505';

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

/**
 * True when the query failed because it broke the given unique constraint.
 * Letting the database detect duplicates is race-free, unlike checking for
 * an existing row first and inserting afterwards.
 */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError = error.driverError as PostgresDriverError;
  return (
    driverError.code === UNIQUE_VIOLATION &&
    driverError.constraint === constraint
  );
}
