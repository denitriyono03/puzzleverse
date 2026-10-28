import { describe, it, expect } from 'vitest';
import { checkThreadAnswer, generateThread, normalizeAnswer, THREAD_DEFS } from './thread';
describe('Common Thread', () => {
  it('accepts answers case-insensitively and via aliases, rejects others', () => {
    const p = generateThread('easy', 0); // first easy def: Trees
    expect(checkThreadAnswer('trees', p)).toBe(true);
    expect(checkThreadAnswer('  Tree! ', p)).toBe(true);
    expect(checkThreadAnswer('rocks', p)).toBe(false);
    expect(normalizeAnswer('  Hello, World! ')).toBe('hello world');
  });
  it('has at least 12 curated puzzles across difficulties', () => {
    expect(THREAD_DEFS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(THREAD_DEFS.map((d) => d.difficulty)).size).toBe(3);
    for (const d of THREAD_DEFS) { expect(d.clues.length).toBe(4); expect(d.answer.length).toBeGreaterThan(0); }
  });
});
