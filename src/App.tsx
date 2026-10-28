import React, { useEffect, useMemo, useState } from 'react';
import { browserAdapter, loadStore, saveStore, type Store } from './lib/store';
import { t, type Lang } from './i18n';
import { CONFIG } from './config';
import { generatePuzzle, type AnyPuzzle } from './games/daily';
import { dailySeed, utcDateString, seedFromString } from './lib/rng';
import type { Difficulty, GameRecord, GameType } from './games/types';
import { QueensGame, TangoGame, ZipGame, ThreadGame } from './games/GameComponents';
import type { QueensPuzzle } from './games/queens';
import type { TangoPuzzle } from './games/tango';
import type { ZipPuzzle } from './games/zip';
import type { ThreadPuzzle } from './games/thread';
import { HomeView, LibraryView, DailyView, HistoryView, StatsView, AchievementsView, LeaderboardView, ProfileView, FriendsView, NotificationsView, SettingsView, PremiumView, PrivacyView, HelpView, AboutView, gameName, unlockedAchievements } from './views';
import { Card, Modal } from './components/ui';

type View = 'home' | 'library' | 'daily' | 'game' | 'results' | 'history' | 'stats' | 'achievements' | 'leaderboard' | 'profile' | 'friends' | 'notifications' | 'settings' | 'premium' | 'privacy' | 'help' | 'about';
interface GameState { game: GameType; mode: 'daily' | 'free'; difficulty: Difficulty; puzzle: AnyPuzzle; initialState?: unknown; initialElapsed?: number; initialMoves?: number; initialHints?: number; initialMistakes?: number }

export default function App() {
  const adapter = useMemo(() => browserAdapter(), []);
  const [store, setStoreState] = useState<Store>(() => loadStore(adapter));
  const [view, setView] = useState<View>('home');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastResult, setLastResult] = useState<GameRecord | null>(null);
  const [onboarded, setOnboarded] = useState(() => { try { return localStorage.getItem('puzzleverse-onboarded') === '1'; } catch { return true; } });
  const lang: Lang = store.settings.language;

  function update(fn: (s: Store) => void) {
    setStoreState((prev) => { const next: Store = JSON.parse(JSON.stringify(prev)); fn(next); saveStore(adapter, next); return next; });
  }
  // Theme / accent / font size / reduced motion effects (settings actually work).
  useEffect(() => {
    const resolved = store.settings.theme === 'system'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : store.settings.theme;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.setProperty('--accent', store.settings.accent);
    document.documentElement.style.setProperty('--font-scale', store.settings.textSize === 'small' ? '0.9' : store.settings.textSize === 'large' ? '1.15' : '1');
    document.documentElement.dataset.boardStyle = store.settings.boardStyle;
    document.documentElement.classList.toggle('reduced', store.settings.reducedMotion);
  }, [store.settings]);

  function startGame(game: GameType, mode: 'daily' | 'free', difficulty: Difficulty) {
    const seed = mode === 'daily' ? dailySeed(game, utcDateString()) : seedFromString(`${game}-${Date.now()}-${Math.random()}`);
    const puzzle = generatePuzzle(game, difficulty, seed, mode);
    setGameState({ game, mode, difficulty, puzzle }); setView('game');
  }
  function resume() {
    const cs = store.currentSession; if (!cs) return;
    setGameState({
      game: cs.game, mode: cs.mode, difficulty: cs.difficulty, puzzle: cs.puzzle as AnyPuzzle,
      initialState: cs.state, initialElapsed: cs.elapsedSec, initialMoves: cs.moves, initialHints: cs.hints, initialMistakes: cs.mistakes,
    }); setView('game');
  }
  function handleComplete(result: { elapsedSec: number; moves: number; hints: number; mistakes: number; score: number }) {
    if (!gameState) return;
    const before = unlockedAchievements(store.history);
    const record: GameRecord = {
      id: `rec-${Date.now()}`, userId: store.profile.id, game: gameState.game, puzzleId: gameState.puzzle.id, seed: gameState.puzzle.seed,
      difficulty: gameState.difficulty, mode: gameState.mode, startedAt: new Date(Date.now() - result.elapsedSec * 1000).toISOString(),
      completedAt: new Date().toISOString(), elapsedSec: result.elapsedSec, moves: result.moves, hints: result.hints,
      mistakes: result.mistakes, score: result.score, completed: true,
    };
    const after = unlockedAchievements([...store.history, record]);
    const newly = after.filter((id) => !before.includes(id));
    update((s) => {
      s.history.push(record); s.currentSession = null;
      if (s.settings.notifyAchievements) {
        for (const id of newly) s.notifications.unshift({ id: `n-${Date.now()}-${id}`, title: 'Achievement unlocked!', body: `You unlocked ${id}.`, date: new Date().toISOString(), read: false });
      }
    });
    setLastResult(record); setView('results');
  }
  function saveSession(state: unknown, elapsed: number, moves: number, hints: number, mistakes: number) {
    if (!gameState) return;
    setStoreState((prev) => {
      const next: Store = JSON.parse(JSON.stringify(prev));
      next.currentSession = { game: gameState.game, mode: gameState.mode, difficulty: gameState.difficulty, puzzleId: gameState.puzzle.id, puzzle: gameState.puzzle, state, elapsedSec: elapsed, moves, hints, mistakes, startedAt: new Date().toISOString() };
      saveStore(adapter, next); return next;
    });
  }
  const common = {
    settings: { showTimer: store.settings.showTimer, showMoves: store.settings.showMoves, hintConfirmation: store.settings.hintConfirmation, sound: store.settings.sound },
    onQuit: () => setView('home'), onSave: saveSession,
    tutorialSeen: gameState ? !!store.tutorialsSeen[gameState.game] : true,
    onTutorialSeen: () => { if (gameState) update((s) => { s.tutorialsSeen[gameState.game] = true; }); },
    onToggleSound: () => update((s) => { s.settings.sound = !s.settings.sound; }),
    onToggleTimer: () => update((s) => { s.settings.showTimer = !s.settings.showTimer; }),
  };
  const nav: { v: View; label: string }[] = [
    { v: 'home', label: t(lang, 'home') }, { v: 'library', label: t(lang, 'library') }, { v: 'daily', label: t(lang, 'daily') },
    { v: 'history', label: t(lang, 'history') }, { v: 'stats', label: t(lang, 'stats') }, { v: 'achievements', label: t(lang, 'achievements') },
    { v: 'leaderboard', label: t(lang, 'leaderboard') }, { v: 'profile', label: t(lang, 'profile') }, { v: 'friends', label: t(lang, 'friends') },
    { v: 'notifications', label: t(lang, 'notifications') }, { v: 'settings', label: t(lang, 'settings') }, { v: 'premium', label: t(lang, 'premium') },
    { v: 'privacy', label: t(lang, 'privacy') }, { v: 'help', label: t(lang, 'help') }, { v: 'about', label: t(lang, 'about') },
  ];
  const viewProps = {
    store, update, navigate: (v: string) => setView(v as View), startGame, resume, lang,
  };
  return (
    <div>
      <header className="topbar">
        <span className="brand">🧩 <span>{CONFIG.appName}</span></span>
        <nav className="nav" aria-label="Main navigation">
          {nav.map((n) => <button key={n.v} className={view === n.v ? 'active' : ''} onClick={() => setView(n.v)}>{n.label}</button>)}
        </nav>
        <span style={{ marginLeft: 'auto' }}>{store.profile.avatar} {store.profile.name} {store.premium.status === 'premium' ? '⭐ Premium' : 'Free'}</span>
      </header>
      <main className="wrap">
        {view === 'home' && <HomeView {...viewProps} />}
        {view === 'library' && <LibraryView {...viewProps} />}
        {view === 'daily' && <DailyView {...viewProps} />}
        {view === 'history' && <HistoryView {...viewProps} />}
        {view === 'stats' && <StatsView {...viewProps} />}
        {view === 'achievements' && <AchievementsView {...viewProps} />}
        {view === 'leaderboard' && <LeaderboardView {...viewProps} />}
        {view === 'profile' && <ProfileView {...viewProps} />}
        {view === 'friends' && <FriendsView {...viewProps} />}
        {view === 'notifications' && <NotificationsView {...viewProps} />}
        {view === 'settings' && <SettingsView {...viewProps} />}
        {view === 'premium' && <PremiumView {...viewProps} />}
        {view === 'privacy' && <PrivacyView {...viewProps} />}
        {view === 'help' && <HelpView {...viewProps} />}
        {view === 'about' && <AboutView {...viewProps} />}
        {view === 'game' && gameState && (
          <div>
            {gameState.game === 'queens' && <QueensGame puzzle={gameState.puzzle as QueensPuzzle} {...common} initialState={gameState.initialState} initialElapsed={gameState.initialElapsed} initialMoves={gameState.initialMoves} initialHints={gameState.initialHints} initialMistakes={gameState.initialMistakes} onComplete={handleComplete} />}
            {gameState.game === 'tango' && <TangoGame puzzle={gameState.puzzle as TangoPuzzle} {...common} initialState={gameState.initialState} initialElapsed={gameState.initialElapsed} initialMoves={gameState.initialMoves} initialHints={gameState.initialHints} initialMistakes={gameState.initialMistakes} onComplete={handleComplete} />}
            {gameState.game === 'zip' && <ZipGame puzzle={gameState.puzzle as ZipPuzzle} {...common} initialState={gameState.initialState} initialElapsed={gameState.initialElapsed} initialMoves={gameState.initialMoves} initialHints={gameState.initialHints} initialMistakes={gameState.initialMistakes} onComplete={handleComplete} />}
            {gameState.game === 'thread' && <ThreadGame puzzle={gameState.puzzle as ThreadPuzzle} {...common} initialState={gameState.initialState} initialElapsed={gameState.initialElapsed} initialMoves={gameState.initialMoves} initialHints={gameState.initialHints} initialMistakes={gameState.initialMistakes} onComplete={handleComplete} />}
          </div>
        )}
        {view === 'results' && lastResult && (
          <Card>
            <h1>🎉 Puzzle complete!</h1>
            <p>{gameName(lastResult.game)} — {lastResult.difficulty} — {lastResult.mode === 'daily' ? 'Daily challenge' : 'Free play'}</p>
            <div className="grid grid3">
              <div><p className="stat">{lastResult.score}</p><p className="muted">Score</p></div>
              <div><p className="stat">{Math.floor(lastResult.elapsedSec / 60)}:{String(lastResult.elapsedSec % 60).padStart(2, '0')}</p><p className="muted">Time</p></div>
              <div><p className="stat">{lastResult.moves}</p><p className="muted">Moves · {lastResult.hints} hints · {lastResult.mistakes} mistakes</p></div>
            </div>
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn primary" onClick={() => gameState && startGame(gameState.game, gameState.mode, gameState.difficulty)}>Play again</button>
              <button className="btn" onClick={() => setView('library')}>Game library</button>
              <button className="btn" onClick={() => setView('home')}>Home</button>
              <button className="btn" onClick={() => setView('history')}>View history</button>
            </div>
          </Card>
        )}
      </main>
      {!onboarded && (
        <Modal title={t(lang, 'welcome')} onClose={() => { setOnboarded(true); try { localStorage.setItem('puzzleverse-onboarded', '1'); } catch { /* ignore */ } }}>
          <p>{t(lang, 'tagline')}</p>
          <p>Play as a guest — no account required. Your progress is saved on this device, and you can create a local account later from Profile.</p>
          <div className="row">
            <button className="btn primary" onClick={() => { setOnboarded(true); try { localStorage.setItem('puzzleverse-onboarded', '1'); } catch { /* ignore */ } }}>Play as guest</button>
            <button className="btn" onClick={() => { setOnboarded(true); try { localStorage.setItem('puzzleverse-onboarded', '1'); } catch { /* ignore */ } setView('profile'); }}>Sign in / sign up</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
