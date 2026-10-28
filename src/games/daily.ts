import { dailySeed, utcDateString } from '../lib/rng';
import type { Difficulty, GameType } from './types';
import { generateQueens, type QueensPuzzle } from './queens';
import { generateTango, type TangoPuzzle } from './tango';
import { generateZip, type ZipPuzzle } from './zip';
import { generateThread, type ThreadPuzzle } from './thread';
export type AnyPuzzle = QueensPuzzle | TangoPuzzle | ZipPuzzle | ThreadPuzzle;
export function generatePuzzle(game: GameType, difficulty: Difficulty, seed: number, mode: 'daily' | 'free'): AnyPuzzle {
  if (game === 'queens') return generateQueens(difficulty, seed, mode);
  if (game === 'tango') return generateTango(difficulty, seed, mode);
  if (game === 'zip') return generateZip(difficulty, seed, mode);
  return generateThread(difficulty, seed, mode);
}
export function dailyPuzzle(game: GameType, difficulty: Difficulty = 'medium', date = utcDateString()): AnyPuzzle {
  return generatePuzzle(game, difficulty, dailySeed(game, date), 'daily');
}
export function dailyPuzzleId(game: GameType, date = utcDateString()): string {
  return `daily-${game}-${date}`;
}
