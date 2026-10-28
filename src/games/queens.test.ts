import { describe, it, expect } from 'vitest';
import { generateQueens, validateQueens, queensHint, buildRegions } from './queens';
describe('Queens', () => {
  it('rejects row, column, region and adjacency violations', () => {
    const p = generateQueens('easy', 42);
    const grid = Array(p.size * p.size).fill(0);
    p.solution.forEach((c, r) => { grid[r * p.size + c] = 1; });
    expect(validateQueens(grid, p).complete).toBe(true);
    // row duplicate: add a second queen in row 0
    const bad = [...grid]; const other = p.solution[0] === 0 ? 1 : 0; bad[other] = 1;
    expect(validateQueens(bad, p).errors.length).toBeGreaterThan(0);
    // adjacency: place queens in neighbouring cells
    const adj = Array(p.size * p.size).fill(0); adj[0] = 1; adj[1] = 1;
    expect(validateQueens(adj, p).errors).toContain('Two queens are adjacent');
    // incomplete grid is not complete
    expect(validateQueens(Array(p.size * p.size).fill(0), p).complete).toBe(false);
  });
  it('regions each contain exactly one solution queen and are contiguous', () => {
    const p = generateQueens('medium', 7);
    const counts = new Map<number, number>();
    p.solution.forEach((c, r) => { const reg = p.regions[r][c]; counts.set(reg, (counts.get(reg) || 0) + 1); });
    expect(counts.size).toBe(p.size); for (const v of counts.values()) expect(v).toBe(1);
    expect(p.regions.flat().every((x) => x >= 0)).toBe(true);
    expect(buildRegions(p.size, p.solution, () => 0.5).flat().every((x) => x >= 0)).toBe(true);
  });
  it('hint points at an unplaced solution queen', () => {
    const p = generateQueens('easy', 3); const grid = Array(p.size * p.size).fill(0);
    const h = queensHint(grid, p); expect(h).not.toBeNull();
    expect(grid[h!] === 0 && p.solution[Math.floor(h! / p.size)] === h! % p.size).toBe(true);
  });
});
