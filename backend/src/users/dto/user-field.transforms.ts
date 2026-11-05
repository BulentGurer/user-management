import type { TransformFnParams } from 'class-transformer';
import { normalizeUsername } from '../username.js';

/*
 * Applied before validation. Non-string values are passed through untouched,
 * so that @IsString reports them instead of the transform failing.
 */

export function toNormalizedUsername({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? normalizeUsername(value) : value;
}

export function toTrimmedString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
