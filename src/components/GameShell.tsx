import React, { useEffect, useState } from 'react';
import { formatTime } from '../games/types';
import { Modal } from './ui';
export interface ShellProps {
  title: string; difficulty: string; elapsed: number; moves: number; hints: number; mistakes: number;
  showTimer: boolean; showMoves: boolean; hintConfirmation: boolean; sound: boolean;
  onHint: () => void; onUndo: () => void; onReset: () => void; onRestart: () => void; onQuit: () => void;
  onPauseToggle: (paused: boolean) => void; paused: boolean; children: React.ReactNode;
  tutorial: React.ReactNode | null; tutorialOpen: boolean; onTutorialClose: () => void;
  error?: string | null; onToggleSound: () => void; onToggleTimer: () => void;
}
export function GameShell(p: ShellProps) {
  const [confirmHint, setConfirmHint] = useState(false);
  useEffect(() => { if (!p.paused) return; }, [p.paused]);
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div><h2 style={{ margin: 0 }}>{p.title}</h2><p className="muted small" style={{ margin: 0 }}>{p.difficulty}</p></div>
        <div className="row">
          {p.showTimer && <span className="badge">⏱ {formatTime(p.elapsed)}</span>}
          {p.showMoves && <span className="badge">Moves {p.moves}</span>}
          <span className="badge">Hints {p.hints}</span><span className="badge">Mistakes {p.mistakes}</span>
        </div>
      </div>
      {p.error && <p className="err" role="alert">{p.error}</p>}
      <div className="row" style={{ margin: '1rem 0' }}>
        <button className="btn" onClick={() => { if (p.hintConfirmation) setConfirmHint(true); else p.onHint(); }}>💡 Hint</button>
        <button className="btn" onClick={p.onUndo}>↩ Undo</button>
        <button className="btn" onClick={p.onReset}>Reset</button>
        <button className="btn" onClick={p.onRestart}>Restart</button>
        <button className="btn" onClick={() => p.onPauseToggle(true)}>⏸ Pause</button>
        <button className="btn" onClick={p.onQuit}>Quit</button>
      </div>
      {confirmHint && (
        <Modal title="Use a hint?" onClose={() => setConfirmHint(false)}>
          <p>Using a hint costs 15 points. Continue?</p>
          <div className="row"><button className="btn primary" onClick={() => { setConfirmHint(false); p.onHint(); }}>Yes, use hint</button><button className="btn" onClick={() => setConfirmHint(false)}>Cancel</button></div>
        </Modal>
      )}
      {p.paused && (
        <Modal title="Paused" onClose={() => p.onPauseToggle(false)}>
          <p>Your timer is paused. Your progress is saved locally.</p>
          <div className="row">
            <button className="btn primary" onClick={() => p.onPauseToggle(false)}>Resume</button>
            <button className="btn" onClick={p.onRestart}>Restart</button>
            <button className="btn" onClick={p.onQuit}>Quit to Home</button>
          </div>
          <div className="toggle"><span>Sound</span><input type="checkbox" checked={p.sound} onChange={p.onToggleSound} /></div>
          <div className="toggle"><span>Show timer</span><input type="checkbox" checked={p.showTimer} onChange={p.onToggleTimer} /></div>
        </Modal>
      )}
      {p.tutorialOpen && p.tutorial && (
        <Modal title="How to play" onClose={p.onTutorialClose}>{p.tutorial}<button className="btn primary" onClick={p.onTutorialClose}>Start playing</button></Modal>
      )}
      {p.children}
    </div>
  );
}
