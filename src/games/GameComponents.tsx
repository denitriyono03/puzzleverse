import React, { useEffect, useRef, useState } from 'react';
import { GameShell } from '../components/GameShell';
import { computeScore } from './scoring';
import { validateQueens, queensHint, type QueensPuzzle } from './queens';
import { validateTango, tangoHint, type TangoPuzzle } from './tango';
import { validateZip, zipHint, isAdjacent, type ZipPuzzle } from './zip';
import { checkThreadAnswer, type ThreadPuzzle } from './thread';
import { formatTime, type Difficulty } from './types';
import { playBeep } from '../lib/sound';

export interface CommonProps {
  settings: { showTimer: boolean; showMoves: boolean; hintConfirmation: boolean; sound: boolean };
  onComplete: (r: { elapsedSec: number; moves: number; hints: number; mistakes: number; score: number }) => void;
  onQuit: () => void; onSave: (state: unknown, elapsed: number, moves: number, hints: number, mistakes: number) => void;
  initialState?: unknown; initialElapsed?: number; initialMoves?: number; initialHints?: number; initialMistakes?: number;
  tutorialSeen: boolean; onTutorialSeen: () => void; onToggleSound?: () => void; onToggleTimer?: () => void;
}
function useTimer(paused: boolean, initial: number) {
  const [elapsed, setElapsed] = useState(initial);
  useEffect(() => {
    if (paused) return; const id = setInterval(() => setElapsed((e) => e + 1), 1000); return () => clearInterval(id);
  }, [paused]);
  return [elapsed, setElapsed] as const;
}
function useCommon(p: CommonProps) {
  const [paused, setPaused] = useState(false);
  const [moves, setMoves] = useState(p.initialMoves || 0);
  const [hints, setHints] = useState(p.initialHints || 0);
  const [mistakes, setMistakes] = useState(p.initialMistakes || 0);
  const [elapsed, setElapsed] = useTimer(paused, p.initialElapsed || 0);
  const [tutorialOpen, setTutorialOpen] = useState(!p.tutorialSeen);
  const [done, setDone] = useState(false);
  return { paused, setPaused, moves, setMoves, hints, setHints, mistakes, setMistakes, elapsed, setElapsed, tutorialOpen, setTutorialOpen, done, setDone };
}
function finish(p: CommonProps, c: ReturnType<typeof useCommon>, difficulty: Difficulty) {
  if (c.done) return; c.setDone(true);
  const score = computeScore({ difficulty, elapsedSec: c.elapsed, hints: c.hints, mistakes: c.mistakes, completed: true });
  playBeep(p.settings.sound, 880, 150);
  p.onComplete({ elapsedSec: c.elapsed, moves: c.moves, hints: c.hints, mistakes: c.mistakes, score });
}

export function QueensGame({ puzzle, ...p }: { puzzle: QueensPuzzle } & CommonProps) {
  const c = useCommon(p);
  const [grid, setGrid] = useState<number[]>(() => (Array.isArray(p.initialState) ? (p.initialState as number[]) : Array(puzzle.size * puzzle.size).fill(0)));
  const [hist, setHist] = useState<number[][]>([]); const [error, setError] = useState<string | null>(null); const [tool, setTool] = useState<'queen' | 'x'>('queen');
  const [hintCell, setHintCell] = useState<number | null>(null);
  useEffect(() => { p.onSave(grid, c.elapsed, c.moves, c.hints, c.mistakes); }, [grid, c.elapsed]);
  function act(newGrid: number[]) {
    setHist((h) => [...h, grid]); setGrid(newGrid); c.setMoves((m) => m + 1); setError(null); setHintCell(null);
    const check = validateQueens(newGrid, puzzle);
    if (newGrid.some((v, i) => v === 1 && grid[i] !== 1) && !check.valid && check.queenCount > 0) {
      // Count a mistake only when the new queen creates a conflict.
      const before = validateQueens(grid, puzzle); if (before.valid) c.setMistakes((m) => m + 1);
    }
    if (check.complete) finish(p, c, puzzle.difficulty);
  }
  function click(i: number) {
    if (c.paused || c.done) return;
    const g = [...grid];
    if (tool === 'queen') g[i] = g[i] === 1 ? 0 : 1; else g[i] = g[i] === 2 ? 0 : 2;
    playBeep(p.settings.sound); act(g);
  }
  function hint() {
    if (c.hints >= 3) { setError('Hint limit reached for this puzzle (3).'); return; }
    const h = queensHint(grid, puzzle); if (h === null) return;
    const g = [...grid]; g[h] = 1; setHist((hh) => [...hh, grid]); setGrid(g); c.setHints((x) => x + 1); c.setMoves((m) => m + 1); setHintCell(h);
    if (validateQueens(g, puzzle).complete) finish(p, { ...c, hints: c.hints + 1 }, puzzle.difficulty);
  }
  const check = validateQueens(grid, puzzle);
  return (
    <GameShell title="Crown Grid" difficulty={puzzle.difficulty} elapsed={c.elapsed} moves={c.moves} hints={c.hints} mistakes={c.mistakes}
      showTimer={p.settings.showTimer} showMoves={p.settings.showMoves} hintConfirmation={p.settings.hintConfirmation} sound={p.settings.sound}
      onHint={hint} onUndo={() => { const prev = hist[hist.length - 1]; if (prev) { setGrid(prev); setHist(hist.slice(0, -1)); } }}
      onReset={() => { setHist([...hist, grid]); setGrid(Array(puzzle.size * puzzle.size).fill(0)); }}
      onRestart={() => { setGrid(Array(puzzle.size * puzzle.size).fill(0)); setHist([]); c.setMoves(0); c.setHints(0); c.setMistakes(0); c.setElapsed(0); c.setDone(false); }}
      onQuit={p.onQuit} onPauseToggle={c.setPaused} paused={c.paused} error={error || (check.errors[0] || null)}
      onToggleSound={p.onToggleSound || (() => {})} onToggleTimer={p.onToggleTimer || (() => {})} tutorial={TUTORIALS.queens} tutorialOpen={c.tutorialOpen} onTutorialClose={() => { c.setTutorialOpen(false); p.onTutorialSeen(); }}>
      <p className="muted">Tool: <button className="btn primary" onClick={() => setTool('queen')}>👑 Queen</button> <button className="btn" onClick={() => setTool('x')}>✕ X mark</button> — tap a cell. One queen per row, column and coloured region; no adjacent queens, even diagonally.</p>
      <div className="board" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
        {grid.map((v, i) => (
          <button key={i} className={`cell q-region-${puzzle.regions[Math.floor(i / puzzle.size)][i % puzzle.size]} ${hintCell === i ? 'hint' : ''}`} onClick={() => click(i)} aria-label={`Cell ${i + 1}`}>
            {v === 1 ? '👑' : v === 2 ? '✕' : ''}
          </button>
        ))}
      </div>
      <p className="small muted">Queens placed: {check.queenCount} / {puzzle.size}. Regions are coloured; each region holds exactly one queen.</p>
    </GameShell>
  );
}

export function TangoGame({ puzzle, ...p }: { puzzle: TangoPuzzle } & CommonProps) {
  const c = useCommon(p);
  const [grid, setGrid] = useState<number[]>(() => (Array.isArray(p.initialState) ? (p.initialState as number[]) : [...puzzle.prefilled]));
  const [hist, setHist] = useState<number[][]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { p.onSave(grid, c.elapsed, c.moves, c.hints, c.mistakes); }, [grid, c.elapsed]);
  function click(i: number) {
    if (c.paused || c.done || puzzle.prefilled[i]) return;
    const g = [...grid]; g[i] = g[i] === 0 ? 1 : g[i] === 1 ? 2 : 0;
    setHist((h) => [...h, grid]); setGrid(g); c.setMoves((m) => m + 1); playBeep(p.settings.sound);
    if (validateTango(g, puzzle).complete) finish(p, c, puzzle.difficulty);
  }
  function hint() {
    if (c.hints >= 3) { setError('Hint limit reached for this puzzle (3).'); return; }
    const h = tangoHint(grid, puzzle); if (h === null) return;
    const g = [...grid]; g[h] = puzzle.solution[h]; setHist((hh) => [...hh, grid]); setGrid(g); c.setHints((x) => x + 1); c.setMoves((m) => m + 1);
    if (validateTango(g, puzzle).complete) finish(p, { ...c, hints: c.hints + 1 }, puzzle.difficulty);
  }
  const check = validateTango(grid, puzzle);
  return (
    <GameShell title="Sun & Moon" difficulty={puzzle.difficulty} elapsed={c.elapsed} moves={c.moves} hints={c.hints} mistakes={c.mistakes}
      showTimer={p.settings.showTimer} showMoves={p.settings.showMoves} hintConfirmation={p.settings.hintConfirmation} sound={p.settings.sound}
      onHint={hint} onUndo={() => { const prev = hist[hist.length - 1]; if (prev) { setGrid(prev); setHist(hist.slice(0, -1)); } }}
      onReset={() => { setHist([...hist, grid]); setGrid([...puzzle.prefilled]); }}
      onRestart={() => { setGrid([...puzzle.prefilled]); setHist([]); c.setMoves(0); c.setHints(0); c.setMistakes(0); c.setElapsed(0); c.setDone(false); }}
      onQuit={p.onQuit} onPauseToggle={c.setPaused} paused={c.paused} error={error || (check.errors[0] || null)}
      onToggleSound={p.onToggleSound || (() => {})} onToggleTimer={p.onToggleTimer || (() => {})} tutorial={TUTORIALS.tango} tutorialOpen={c.tutorialOpen} onTutorialClose={() => { c.setTutorialOpen(false); p.onTutorialSeen(); }}>
      <p className="muted">Tap a cell to cycle empty → ☀️ → 🌙. Each row and column must have 3 suns and 3 moons, no three in a row, and all = / × signs must hold.</p>
      <div className="board" style={{ gridTemplateColumns: `repeat(6, 1fr)` }}>
        {grid.map((v, i) => (
          <button key={i} className={`cell ${puzzle.prefilled[i] ? 'locked' : ''}`} onClick={() => click(i)} aria-label={`Cell ${i + 1}`}>
            {v === 1 ? '☀️' : v === 2 ? '🌙' : ''}
          </button>
        ))}
      </div>
      <p className="small muted">Constraints: {puzzle.constraints.map((con) => `${con.a + 1}${con.type}${con.b + 1}`).join(', ')}</p>
    </GameShell>
  );
}

export function ZipGame({ puzzle, ...p }: { puzzle: ZipPuzzle } & CommonProps) {
  const c = useCommon(p);
  const [path, setPath] = useState<number[]>(() => (Array.isArray(p.initialState) ? (p.initialState as number[]) : [puzzle.checkpoints[0].index]));
  const [hist, setHist] = useState<number[][]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { p.onSave(path, c.elapsed, c.moves, c.hints, c.mistakes); }, [path, c.elapsed]);
  function click(i: number) {
    if (c.paused || c.done) return;
    if (path[path.length - 1] === i && path.length > 1) { setHist((h) => [...h, path]); setPath(path.slice(0, -1)); c.setMoves((m) => m + 1); return; }
    if (path.includes(i)) { setError('That cell is already in the path.'); return; }
    if (!isAdjacent(path[path.length - 1], i, puzzle.size)) { setError('Move to an adjacent cell (up, down, left or right).'); c.setMistakes((m) => m + 1); return; }
    const cp = puzzle.checkpoints.find((x) => x.index === i);
    const nextNum = (path.map((idx) => puzzle.checkpoints.find((x) => x.index === idx)?.num || 0).filter(Boolean).sort((a, b) => a - b).pop() || 0) + 1;
    if (cp && cp.num !== nextNum) { setError(`Checkpoint ${nextNum} must come before checkpoint ${cp.num}.`); c.setMistakes((m) => m + 1); return; }
    const np = [...path, i]; setHist((h) => [...h, path]); setPath(np); c.setMoves((m) => m + 1); setError(null); playBeep(p.settings.sound);
    if (validateZip(np, puzzle).complete) finish(p, c, puzzle.difficulty);
  }
  function hint() {
    if (c.hints >= 3) { setError('Hint limit reached for this puzzle (3).'); return; }
    const h = zipHint(path, puzzle);
    if (h === null) { setError('Hint is only available when your path matches the solution so far. Undo to the last correct step, then try again.'); return; }
    const np = [...path, h]; setHist((hh) => [...hh, path]); setPath(np); c.setHints((x) => x + 1); c.setMoves((m) => m + 1);
    if (validateZip(np, puzzle).complete) finish(p, { ...c, hints: c.hints + 1 }, puzzle.difficulty);
  }
  const check = validateZip(path, puzzle);
  return (
    <GameShell title="Path Link" difficulty={puzzle.difficulty} elapsed={c.elapsed} moves={c.moves} hints={c.hints} mistakes={c.mistakes}
      showTimer={p.settings.showTimer} showMoves={p.settings.showMoves} hintConfirmation={p.settings.hintConfirmation} sound={p.settings.sound}
      onHint={hint} onUndo={() => { const prev = hist[hist.length - 1]; if (prev) { setPath(prev); setHist(hist.slice(0, -1)); } }}
      onReset={() => { setHist([...hist, path]); setPath([puzzle.checkpoints[0].index]); }}
      onRestart={() => { setPath([puzzle.checkpoints[0].index]); setHist([]); c.setMoves(0); c.setHints(0); c.setMistakes(0); c.setElapsed(0); c.setDone(false); }}
      onQuit={p.onQuit} onPauseToggle={c.setPaused} paused={c.paused} error={error || (check.errors[0] || null)}
      onToggleSound={p.onToggleSound || (() => {})} onToggleTimer={p.onToggleTimer || (() => {})} tutorial={TUTORIALS.zip} tutorialOpen={c.tutorialOpen} onTutorialClose={() => { c.setTutorialOpen(false); p.onTutorialSeen(); }}>
      <p className="muted">Tap adjacent cells to draw one path from 1, through every checkpoint in order, covering every cell exactly once. Tap the last cell to step back.</p>
      <div className="board" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
        {Array.from({ length: puzzle.size * puzzle.size }, (_, i) => {
          const pos = path.indexOf(i); const cp = puzzle.checkpoints.find((x) => x.index === i);
          return <button key={i} className={`cell ${pos >= 0 ? 'path' : ''} ${cp ? 'checkpoint' : ''}`} onClick={() => click(i)} aria-label={`Cell ${i + 1}`}>{cp ? cp.num : pos >= 0 ? pos + 1 : ''}</button>;
        })}
      </div>
      <p className="small muted">Path length: {path.length} / {puzzle.size * puzzle.size}. Elapsed: {formatTime(c.elapsed)}</p>
    </GameShell>
  );
}

export function ThreadGame({ puzzle, ...p }: { puzzle: ThreadPuzzle } & CommonProps) {
  const c = useCommon(p);
  const [input, setInput] = useState(''); const [error, setError] = useState<string | null>(null); const [revealed, setRevealed] = useState(0);
  const [attempts, setAttempts] = useState<string[]>([]);
  useEffect(() => { p.onSave({ attempts }, c.elapsed, c.moves, c.hints, c.mistakes); }, [attempts, c.elapsed]);
  function submit(e?: React.FormEvent) {
    e?.preventDefault(); if (!input.trim() || c.done) return;
    c.setMoves((m) => m + 1); setAttempts((a) => [...a, input]);
    if (checkThreadAnswer(input, puzzle)) finish(p, c, puzzle.difficulty);
    else { c.setMistakes((m) => m + 1); setError(`"${input}" is not the category. Try again.`); setInput(''); playBeep(p.settings.sound, 220, 120); }
  }
  function hint() {
    if (c.hints >= 3) { setError('Hint limit reached (3).'); return; }
    c.setHints((x) => x + 1); setRevealed((r) => Math.min(r + 1, puzzle.answer.length));
  }
  return (
    <GameShell title="Common Thread" difficulty={puzzle.difficulty} elapsed={c.elapsed} moves={c.moves} hints={c.hints} mistakes={c.mistakes}
      showTimer={p.settings.showTimer} showMoves={p.settings.showMoves} hintConfirmation={p.settings.hintConfirmation} sound={p.settings.sound}
      onHint={hint} onUndo={() => { setAttempts((a) => a.slice(0, -1)); c.setMoves((m) => Math.max(0, m - 1)); c.setMistakes((m) => Math.max(0, m - 1)); setError(null); }} onReset={() => { setAttempts([]); setInput(''); setRevealed(0); }}
      onRestart={() => { setAttempts([]); setInput(''); setRevealed(0); c.setMoves(0); c.setHints(0); c.setMistakes(0); c.setElapsed(0); c.setDone(false); }}
      onQuit={p.onQuit} onPauseToggle={c.setPaused} paused={c.paused} error={error}
      onToggleSound={p.onToggleSound || (() => {})} onToggleTimer={p.onToggleTimer || (() => {})} tutorial={TUTORIALS.thread} tutorialOpen={c.tutorialOpen} onTutorialClose={() => { c.setTutorialOpen(false); p.onTutorialSeen(); }}>
      <p className="muted">What single category connects all of these clues?</p>
      <div className="grid grid2">{puzzle.clues.map((clue) => <div key={clue} className="card" style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 }}>{clue}</div>)}</div>
      {revealed > 0 && <p>Hint: answer starts with <strong>{puzzle.answer.slice(0, revealed)}</strong>… ({puzzle.answer.length} letters)</p>}
      <form onSubmit={submit} className="row" style={{ marginTop: '1rem' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type the category…" aria-label="Answer" style={{ flex: 1 }} />
        <button className="btn primary" type="submit">Check answer</button>
      </form>
      {attempts.length > 0 && <p className="small muted">Previous guesses: {attempts.join(', ')}</p>}
    </GameShell>
  );
}

export const TUTORIALS: Record<string, React.ReactNode> = {
  queens: <div><p><strong>Goal:</strong> place one queen in every row, column and coloured region.</p><p>Queens must not touch, even diagonally. Use the X tool to mark cells you have ruled out.</p><p><strong>Try it:</strong> place a queen, check the error message if it conflicts, then undo.</p></div>,
  tango: <div><p><strong>Goal:</strong> fill the grid with suns and moons.</p><p>Each row and column needs equal suns and moons, never three of the same in a row, and every = / × sign between neighbours must hold.</p><p><strong>Try it:</strong> tap a cell to cycle empty → sun → moon.</p></div>,
  zip: <div><p><strong>Goal:</strong> draw one continuous path that covers every cell exactly once.</p><p>The path must pass checkpoints 1, 2, 3… in order, moving only up, down, left or right.</p><p><strong>Try it:</strong> tap the cell next to checkpoint 1, then keep tapping adjacent cells. Tap the last cell to step back.</p></div>,
  thread: <div><p><strong>Goal:</strong> find the one category that connects all four clues.</p><p>Type your answer and press Check. Spelling variants and singular/plural forms are accepted where they mean the same category.</p><p><strong>Try it:</strong> guess, read the feedback, then use a hint for the first letter if you are stuck.</p></div>,
};
