import { LocalStorageTokenStorage, TOKEN_STORAGE_KEY } from './token-storage';

describe('LocalStorageTokenStorage', () => {
  const storage = new LocalStorageTokenStorage();

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a saved token until it expires', () => {
    storage.save('token-1', 60);

    expect(storage.read()).toBe('token-1');

    vi.advanceTimersByTime(59_000);
    expect(storage.read()).toBe('token-1');
  });

  it('drops an expired token instead of returning it', () => {
    storage.save('token-1', 60);

    vi.advanceTimersByTime(60_000);

    expect(storage.read()).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('ignores malformed stored values', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'not-json');
    expect(storage.read()).toBeNull();

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ value: 42 }));
    expect(storage.read()).toBeNull();
  });

  it('clears the token', () => {
    storage.save('token-1', 60);

    storage.clear();

    expect(storage.read()).toBeNull();
  });
});
