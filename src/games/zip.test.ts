import { describe, it, expect } from 'vitest';
import { generateZip, validateZip, zipHint, isAdjacent } from './zip';
describe('Zip', () => {
  it('generated path covers every cell once, orthogonally, checkpoints in order', () => {
    const p = generateZip('easy', 21);
    expect(p.solutionPath.length).toBe(25); expect(new Set(p.solutionPath).size).toBe(25);
    expect(validateZip(p.solutionPath, p).complete).toBe(true);
    expect(p.checkpoints[0].index).toBe(p.solutionPath[0]);
    expect(p.checkpoints[p.checkpoints.length - 1].index).toBe(p.solutionPath[p.solutionPath.length - 1]);
  });
  it('rejects repeats, diagonal steps, and out-of-order checkpoints', () => {
    const p = generateZip('easy', 21);
    expect(validateZip([...p.solutionPath, p.solutionPath[0]], p).errors.length).toBeGreaterThan(0);
    expect(isAdjacent(0, 1, 5)).toBe(true); expect(isAdjacent(0, 6, 5)).toBe(false);
    const reversed = [...p.solutionPath].reverse();
    expect(validateZip(reversed, p).complete).toBe(false);
    const h = zipHint(p.solutionPath.slice(0, 3), p); expect(h).toBe(p.solutionPath[3]);
  });
});
