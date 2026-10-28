import { mulberry32, shuffle } from '../lib/rng';
import type { Difficulty, PuzzleBase } from './types';
// Path Link (Zip-style, original implementation).
// Draw one orthogonal path that visits every cell exactly once, passing
// numbered checkpoints in order. No revisits, no diagonal moves.
export interface ZipCheckpoint { num: number; index: number }
export interface ZipPuzzle extends PuzzleBase {
  game: 'zip'; size: number; solutionPath: number[]; checkpoints: ZipCheckpoint[];
}
export const ZIP_SIZE: Record<Difficulty, number> = { easy: 5, medium: 6, hard: 7 };
export const ZIP_CHECKPOINTS: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5 };

function snakePath(n: number): number[] {
  const path: number[] = [];
  for (let r = 0; r < n; r++) {
    const cols = r % 2 === 0 ? Array.from({ length: n }, (_, i) => i) : Array.from({ length: n }, (_, i) => n - 1 - i);
    for (const c of cols) path.push(r * n + c);
  }
  return path;
}
function dfsPath(n: number, rand: () => number): number[] | null {
  const total = n * n; const visited = new Set<number>(); const path: number[] = [];
  const start = Math.floor(rand() * total);
  let steps = 0; const LIMIT = 400000;
  function neighbours(idx: number): number[] {
    const r = Math.floor(idx / n), c = idx % n; const out: number[] = [];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) { const ni = nr * n + nc; if (!visited.has(ni)) out.push(ni); }
    }
    // Warnsdorff heuristic: fewest onward moves first.
    return shuffle(out, rand).sort((a, b) => {
      const deg = (x: number) => {
        const rr = Math.floor(x / n), cc = x % n; let d = 0;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = rr + dr, nc = cc + dc;
          if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited.has(nr * n + nc) && nr * n + nc !== x) d++;
        }
        return d;
      };
      return deg(a) - deg(b);
    });
  }
  function bt(idx: number): boolean {
    if (++steps > LIMIT) return false;
    visited.add(idx); path.push(idx);
    if (path.length === total) return true;
    for (const nb of neighbours(idx)) if (bt(nb)) return true;
    visited.delete(idx); path.pop(); return false;
  }
  return bt(start) ? path : null;
}
export function generateZip(difficulty: Difficulty, seed: number, mode: 'daily' | 'free' = 'free'): ZipPuzzle {
  const size = ZIP_SIZE[difficulty]; const k = ZIP_CHECKPOINTS[difficulty];
  let path: number[] | null = null;
  for (let attempt = 0; attempt < 10 && !path; attempt++) path = dfsPath(size, mulberry32(seed + attempt * 104729));
  if (!path) path = snakePath(size); // guaranteed Hamiltonian fallback
  const checkpoints: ZipCheckpoint[] = [];
  for (let i = 0; i < k; i++) {
    const pos = i === k - 1 ? path.length - 1 : Math.floor((i * (path.length - 1)) / (k - 1));
    checkpoints.push({ num: i + 1, index: path[pos] });
  }
  return { id: `${mode}-zip-${difficulty}-${seed}`, game: 'zip', difficulty, seed, mode, size, solutionPath: path, checkpoints };
}
export function isAdjacent(a: number, b: number, n: number): boolean {
  const r1 = Math.floor(a / n), c1 = a % n, r2 = Math.floor(b / n), c2 = b % n;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}
export interface ZipCheck { valid: boolean; complete: boolean; errors: string[] }
export function validateZip(path: number[], puzzle: ZipPuzzle): ZipCheck {
  const errors: string[] = []; const n = puzzle.size;
  if (new Set(path).size !== path.length) errors.push('A cell is visited more than once');
  for (let i = 1; i < path.length; i++) if (!isAdjacent(path[i - 1], path[i], n)) errors.push('Path contains a non-adjacent step');
  const seen = new Map<number, number>(); path.forEach((idx, pos) => seen.set(idx, pos));
  let lastNum = 0;
  for (const cp of [...puzzle.checkpoints].sort((a, b) => a.num - b.num)) {
    if (seen.has(cp.index)) {
      if (cp.num !== lastNum + 1) errors.push(`Checkpoint ${cp.num} was visited out of order`);
      lastNum = cp.num;
    }
  }
  if (path.length > 0 && path[0] !== puzzle.checkpoints[0].index) errors.push('Path must start at checkpoint 1');
  const complete = path.length === n * n && errors.length === 0 && lastNum === puzzle.checkpoints.length;
  return { valid: errors.length === 0, complete, errors: [...new Set(errors)] };
}
export function zipHint(path: number[], puzzle: ZipPuzzle): number | null {
  // Next correct cell after the player's current path, if it matches the solution prefix.
  const sol = puzzle.solutionPath;
  const matches = path.every((v, i) => sol[i] === v);
  if (matches && path.length < sol.length) return sol[path.length];
  return null;
}
