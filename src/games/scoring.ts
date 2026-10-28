import type { Difficulty } from './types';
// Scoring is documented and deterministic:
// base by difficulty + time bonus (up to 100, decaying) - 15/hint - 10/mistake, floored at 0.
// Incomplete games score 0; a completed game never scores below 10.
export const BASE_SCORE: Record<Difficulty, number> = { easy: 100, medium: 200, hard: 300 };
export function computeScore(input: { difficulty: Difficulty; elapsedSec: number; hints: number; mistakes: number; completed: boolean }): number {
  if (!input.completed) return 0;
  const timeBonus = Math.max(0, 100 - Math.floor(input.elapsedSec / 10));
  const raw = BASE_SCORE[input.difficulty] + timeBonus - input.hints * 15 - input.mistakes * 10;
  return Math.max(10, raw);
}
