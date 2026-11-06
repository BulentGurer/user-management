import { durationToMilliseconds, durationToSeconds } from './duration.js';

describe('durationToSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['1h', 3600],
    ['7d', 604800],
  ])('converts %s to %i seconds', (duration, seconds) => {
    expect(durationToSeconds(duration)).toBe(seconds);
  });

  it.each(['', '1', 'h', '1w', '1.5h', 'one hour'])(
    'rejects "%s"',
    (duration) => {
      expect(() => durationToSeconds(duration)).toThrow(/Invalid duration/);
    },
  );
});

describe('durationToMilliseconds', () => {
  it('converts a duration to milliseconds', () => {
    expect(durationToMilliseconds('1m')).toBe(60_000);
  });
});
