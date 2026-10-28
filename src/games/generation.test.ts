import { describe, it, expect } from 'vitest';
import { generateQueens, validateQueens } from './queens';
import { generateTango, validateTango } from './tango';
import { generateZip, validateZip } from './zip';
import { dailyPuzzle, dailyPuzzleId } from './daily';
import { utcDateString } from '../lib/rng';
describe('Generation & daily determinism', () => {
  it('generated Queens/Tango/Zip puzzles have a valid solution', () => {
    const q = generateQueens('easy', 99); const qgrid = Array(q.size * q.size).fill(0); q.solution.forEach((c, r) => { qgrid[r * q.size + c] = 1; }); expect(validateQueens(qgrid, q).complete).toBe(true);
    const t = generateTango('easy', 99); expect(validateTango(t.solution, t).complete).toBe(true);
    const z = generateZip('easy', 99); expect(validateZip(z.solutionPath, z).complete).toBe(true);
  });
  it('daily puzzles are deterministic for the same date and game', () => {
    const a = dailyPuzzle('queens', 'medium', '2026-10-28'); const b = dailyPuzzle('queens', 'medium', '2026-10-28');
    expect(a.id).toBe(b.id); expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(dailyPuzzleId('queens', '2026-10-28')).toBe('daily-queens-2026-10-28');
    expect(utcDateString(new Date('2026-01-02T03:04:05Z'))).toBe('2026-01-02');
  });
});
