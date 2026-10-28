import { describe, it, expect } from 'vitest';
import { generateTango, validateTango } from './tango';
describe('Tango', () => {
  it('solution is valid and balanced, and broken rules are caught', () => {
    const p = generateTango('medium', 11);
    expect(validateTango(p.solution, p).complete).toBe(true);
    // break balance in first row
    const bad = [...p.solution]; bad[0] = bad[0] === 1 ? 2 : 1;
    // only assert it is no longer a fully valid complete grid (balance or constraint may catch it)
    expect(validateTango(bad, p).complete).toBe(false);
    // three in a row
    const three = [...p.solution]; three[0] = 1; three[1] = 1; three[2] = 1;
    expect(validateTango(three, p).errors.some((e) => e.includes('three'))).toBe(true);
    // constraint: flip a constrained pair to break it
    const con = p.constraints[0]; const broken = [...p.solution];
    broken[con.b] = broken[con.a]; // if '=' this is fine, so instead force the opposite for 'x' cases
    if (con.type === 'x') expect(validateTango(broken, p).errors.some((e) => e.includes('constraint'))).toBe(true);
    else { const b2 = [...p.solution]; b2[con.b] = b2[con.b] === 1 ? 2 : 1; expect(validateTango(b2, p).errors.some((e) => e.includes('constraint'))).toBe(true); }
    // empty grid is not complete
    expect(validateTango(Array(36).fill(0), p).complete).toBe(false);
  });
  it('prefilled cells match the solution', () => {
    const p = generateTango('easy', 5);
    p.prefilled.forEach((v, i) => { if (v) expect(v).toBe(p.solution[i]); });
  });
});
