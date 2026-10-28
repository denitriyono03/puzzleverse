import { describe, it, expect } from 'vitest';
import { computeScore } from './scoring';
describe('Scoring', () => {
  it('rewards difficulty and speed, penalises hints and mistakes, never goes below 10 when complete', () => {
    expect(computeScore({ difficulty: 'easy', elapsedSec: 0, hints: 0, mistakes: 0, completed: true })).toBe(200);
    expect(computeScore({ difficulty: 'hard', elapsedSec: 0, hints: 0, mistakes: 0, completed: true })).toBeGreaterThan(
      computeScore({ difficulty: 'easy', elapsedSec: 0, hints: 0, mistakes: 0, completed: true }));
    expect(computeScore({ difficulty: 'easy', elapsedSec: 0, hints: 10, mistakes: 10, completed: true })).toBe(10);
    expect(computeScore({ difficulty: 'hard', elapsedSec: 9999, hints: 0, mistakes: 0, completed: false })).toBe(0);
  });
});
