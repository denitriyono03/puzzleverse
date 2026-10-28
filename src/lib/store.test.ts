import { describe, it, expect } from 'vitest';
import { migrate, initialStore, loadStore, saveStore, memoryAdapter, STORE_VERSION } from './store';
describe('Store', () => {
  it('migrates a v1 shape (games instead of history, no premium) without losing records', () => {
    const rec = { id: 'r1', game: 'queens', completed: true, score: 120 } as never;
    const m = migrate({ version: 1, games: [rec] });
    expect(m.version).toBe(STORE_VERSION); expect(m.history).toHaveLength(1); expect(m.premium.status).toBe('free');
  });
  it('persists and reloads via an adapter', () => {
    const a = memoryAdapter(); const s = initialStore(); s.profile.name = 'Ada'; s.settings.language = 'id';
    saveStore(a, s); const loaded = loadStore(a);
    expect(loaded.profile.name).toBe('Ada'); expect(loaded.settings.language).toBe('id');
  });
  it('returns a fresh store for corrupt data', () => {
    const a = memoryAdapter(); a.set('puzzleverse-store-v1', 'not-json{');
    expect(loadStore(a).profile.name).toBe('Guest Player');
  });
});
