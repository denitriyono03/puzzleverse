export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameType = 'queens' | 'tango' | 'zip' | 'thread';
export type GameMode = 'daily' | 'free';
export interface PuzzleBase { id: string; game: GameType; difficulty: Difficulty; seed: number; mode: GameMode }
export interface GameResultInput {
  game: GameType; puzzleId: string; seed: number; difficulty: Difficulty; mode: GameMode;
  elapsedSec: number; moves: number; hints: number; mistakes: number; completed: boolean; score: number;
}
export interface GameRecord extends GameResultInput {
  id: string; userId: string; startedAt: string; completedAt: string | null;
}
export const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60); const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
