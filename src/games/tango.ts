import { mulberry32, shuffle } from '../lib/rng';
import type { Difficulty, PuzzleBase } from './types';
// Sun & Moon (Tango-style, original implementation).
// 6x6 grid, values: 0 empty, 1 sun, 2 moon. Rules: equal suns/moons per
// row and column, no three consecutive equal symbols in any row/column,
// and '=' / 'x' constraints between adjacent cells.
export interface TangoConstraint { a: number; b: number; type: '=' | 'x' }
export interface TangoPuzzle extends PuzzleBase {
  game: 'tango'; size: 6; solution: number[]; prefilled: number[]; constraints: TangoConstraint[];
}
const PREFILLED: Record<Difficulty, number> = { easy: 12, medium: 8, hard: 4 };
const NCONSTRAINTS: Record<Difficulty, number> = { easy: 6, medium: 10, hard: 14 };

function validPartial(grid: number[], n: number): boolean {
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const v = grid[r * n + c]; if (!v) continue;
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      // no three consecutive: check triples ending at this cell
      const cells: number[] = [];
      for (let k = -2; k <= 0; k++) {
        const rr = r + dr * k, cc = c + dc * k;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) { cells.length = 0; break; }
        cells.push(grid[rr * n + cc]);
      }
      if (cells.length === 3 && cells[0] && cells[0] === cells[1] && cells[1] === cells[2]) return false;
    }
    const rowCount = grid.slice(r * n, r * n + n).filter((x) => x === v).length;
    const colCount = Array.from({ length: n }, (_, rr) => grid[rr * n + c]).filter((x) => x === v).length;
    if (rowCount > n / 2 || colCount > n / 2) return false;
  }
  return true;
}
function genSolution(rand: () => number): number[] | null {
  const n = 6; const grid = Array(n * n).fill(0);
  function bt(i: number): boolean {
    if (i === n * n) return true;
    for (const v of shuffle([1, 2], rand)) {
      grid[i] = v;
      if (validPartial(grid, n) && bt(i + 1)) return true;
      grid[i] = 0;
    }
    return false;
  }
  return bt(0) ? grid : null;
}
export function generateTango(difficulty: Difficulty, seed: number, mode: 'daily' | 'free' = 'free'): TangoPuzzle {
  for (let attempt = 0; attempt < 30; attempt++) {
    const rand = mulberry32(seed + attempt * 7919);
    const solution = genSolution(rand); if (!solution) continue;
    const n = 6;
    // Constraints from the solution, on right/down neighbours only.
    const pairs: [number, number][] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (c + 1 < n) pairs.push([r * n + c, r * n + c + 1]);
      if (r + 1 < n) pairs.push([r * n + c, (r + 1) * n + c]);
    }
    const constraints: TangoConstraint[] = shuffle(pairs, rand).slice(0, NCONSTRAINTS[difficulty])
      .map(([a, b]) => ({ a, b, type: solution[a] === solution[b] ? '=' as const : 'x' as const }));
    const prefilled = Array(n * n).fill(0);
    for (const idx of shuffle(Array.from({ length: n * n }, (_, i) => i), rand).slice(0, PREFILLED[difficulty])) prefilled[idx] = solution[idx];
    return { id: `${mode}-tango-${difficulty}-${seed}`, game: 'tango', difficulty, seed, mode, size: 6, solution, prefilled, constraints };
  }
  throw new Error('Tango generation failed');
}
export interface TangoCheck { valid: boolean; complete: boolean; errors: string[] }
export function validateTango(grid: number[], puzzle: TangoPuzzle): TangoCheck {
  const n = puzzle.size; const errors: string[] = [];
  if (grid.some((v, i) => puzzle.prefilled[i] && v !== puzzle.prefilled[i])) errors.push('A prefilled cell was changed');
  for (let r = 0; r < n; r++) {
    const row = grid.slice(r * n, r * n + n);
    if (row.some((v) => v === 0)) continue;
    if (row.filter((v) => v === 1).length !== n / 2 || row.filter((v) => v === 2).length !== n / 2) errors.push(`Row ${r + 1} is not balanced`);
    for (let c = 0; c + 2 < n; c++) if (row[c] === row[c + 1] && row[c + 1] === row[c + 2]) errors.push(`Row ${r + 1} has three in a row`);
  }
  for (let c = 0; c < n; c++) {
    const col = Array.from({ length: n }, (_, r) => grid[r * n + c]);
    if (col.some((v) => v === 0)) continue;
    if (col.filter((v) => v === 1).length !== n / 2 || col.filter((v) => v === 2).length !== n / 2) errors.push(`Column ${c + 1} is not balanced`);
    for (let r = 0; r + 2 < n; r++) if (col[r] === col[r + 1] && col[r + 1] === col[r + 2]) errors.push(`Column ${c + 1} has three in a row`);
  }
  for (const con of puzzle.constraints) {
    const a = grid[con.a], b = grid[con.b]; if (!a || !b) continue;
    if (con.type === '=' && a !== b) errors.push('An = constraint is broken');
    if (con.type === 'x' && a === b) errors.push('An x constraint is broken');
  }
  const complete = grid.every((v) => v !== 0) && errors.length === 0;
  return { valid: errors.length === 0, complete, errors: [...new Set(errors)] };
}
export function tangoHint(grid: number[], puzzle: TangoPuzzle): number | null {
  for (let i = 0; i < grid.length; i++) if (grid[i] === 0) return i;
  return null;
}
