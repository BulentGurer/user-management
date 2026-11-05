/** A number followed by a unit: s, m, h or d (for example 15m, 1h, 7d). */
export const DURATION_PATTERN = /^(\d+)([smhd])$/;

const SECONDS_PER_UNIT: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
};

export function durationToSeconds(duration: string): number {
  const match = DURATION_PATTERN.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration "${duration}"; expected e.g. 15m or 1h`);
  }
  const [, amount, unit] = match;
  return Number(amount) * SECONDS_PER_UNIT[unit];
}
