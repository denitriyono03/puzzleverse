import { mulberry32, shuffle } from '../lib/rng';
import type { Difficulty, PuzzleBase } from './types';
// Crown Grid (Queens-style, original implementation).
// Rules: exactly one queen per row, per column, per region; no two queens
// adjacent, including diagonally. Cell: 0 empty, 1 queen, 2 X-mark.
export interface QueensPuzzle extends PuzzleBase { game: 'queens'; size: number; regions: number[][]; solution: number[] }
export const QUEENS_SIZE: Record<Difficulty, number> = { easy: 6, medium: 7, hard: 8 };

function genPermutation(n: number, rand: () => number): number[] | null {
  const cols = shuffle(Array.from({ length: n }, (_, i) => i), rand);
  const used = new Set<number>(); const perm: number[] = [];
  // Backtracking over rows in order, honouring the adjacency rule for
  // consecutive rows (the only rows that can be diagonally adjacent).
  function bt(row: number): boolean {
    if (row === n) return true;
    for (const c of shuffle(cols.filter((x) => !used.has(x)), rand)) {
      if (row > 0 && Math.abs(c - perm[row - 1]) === 1) continue;
      used.add(c); perm.push(c);
      if (bt(row + 1)) return true;
      used.delete(c); perm.pop();
    }
    return false;
  }
  return bt(0) ? perm : null;
}

export function buildRegions(n: number, solution: number[], rand: () => number): number[][] {
  const regions: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));
  solution.forEach((col, row) => { regions[row][col] = row; });
  let remaining = n * n - n;
  while (remaining > 0) {
    let progressed = false;
    for (const rid of shuffle(Array.from({ length: n }, (_, i) => i), rand)) {
      const frontier: [number, number][] = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === rid) {
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && regions[nr][nc] === -1) frontier.push([nr, nc]);
        }
      }
      if (frontier.length) {
        const [r, c] = frontier[Math.floor(rand() * frontier.length)];
        regions[r][c] = rid; remaining--; progressed = true;
      }
    }
    if (!progressed) break; // grid is connected, so this should not happen
  }
  return regions;
}

export function generateQueens(difficulty: Difficulty, seed: number, mode: 'daily' | 'free' = 'free'): QueensPuzzle {
  const size = QUEENS_SIZE[difficulty];
  for (let attempt = 0; attempt < 50; attempt++) {
    const rand = mulberry32(seed + attempt * 1009);
    const perm = genPermutation(size, rand);
    if (!perm) continue;
    const regions = buildRegions(size, perm, rand);
    if (regions.flat().some((x) => x === -1)) continue;
    return { id: `${mode}-queens-${difficulty}-${seed}`, game: 'queens', difficulty, seed, mode, size, regions, solution: perm };
  }
  throw new Error('Queens generation failed');
}

export interface QueensCheck { valid: boolean; complete: boolean; errors: string[]; queenCount: number }
export function validateQueens(grid: number[], puzzle: QueensPuzzle): QueensCheck {
  const n = puzzle.size; const errors: string[] = []; const queens: [number, number][] = [];
  grid.forEach((v, i) => { if (v === 1) queens.push([Math.floor(i / n), i % n]); });
  const seenRow = new Set<number>(), seenCol = new Set<number>(), seenRegion = new Set<number>();
  for (const [r, c] of queens) {
    if (seenRow.has(r)) errors.push(`Two queens in row ${r + 1}`);
    if (seenCol.has(c)) errors.push(`Two queens in column ${c + 1}`);
    const reg = puzzle.regions[r][c];
    if (seenRegion.has(reg)) errors.push(`Two queens in region ${reg + 1}`);
    seenRow.add(r); seenCol.add(c); seenRegion.add(reg);
  }
  for (let i = 0; i < queens.length; i++) for (let j = i + 1; j < queens.length; j++) {
    const [r1, c1] = queens[i], [r2, c2] = queens[j];
    if (Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1) errors.push('Two queens are adjacent');
  }
  const complete = queens.length === n && errors.length === 0;
  return { valid: errors.length === 0, complete, errors: [...new Set(errors)], queenCount: queens.length };
}
export function queensHint(grid: number[], puzzle: QueensPuzzle): number | null {
  for (let r = 0; r < puzzle.size; r++) {
    const idx = r * puzzle.size + puzzle.solution[r];
    if (grid[idx] !== 1) return idx;
  }
  return null;
}
