import React, { useMemo, useState } from 'react';
import { Card, Modal, Confirm, AdsBanner } from './components/ui';
import { TUTORIALS } from './games/GameComponents';
import { t, type Lang } from './i18n';
import { CONFIG, ACCENTS } from './config';
import { localLeaderboard, remoteApi } from './lib/api';
import { buyPremiumProduction, canUseMockPremium } from './lib/premium';
import { registerAccount, loginAccount } from './lib/auth';
import { browserAdapter, exportStoreJson, type Store } from './lib/store';
import { dailyPuzzleId, type AnyPuzzle } from './games/daily';
import { utcDateString } from './lib/rng';
import { formatTime, type Difficulty, type GameType } from './games/types';

export interface ViewProps {
  store: Store; update: (fn: (s: Store) => void) => void; navigate: (v: string) => void;
  startGame: (game: GameType, mode: 'daily' | 'free', difficulty: Difficulty) => void;
  resume: () => void; lang: Lang;
}
const GAMES: { type: GameType; name: string; desc: string; emoji: string }[] = [
  { type: 'queens', name: 'Crown Grid', desc: 'One queen per row, column and region. No adjacent queens.', emoji: '👑' },
  { type: 'tango', name: 'Sun & Moon', desc: 'Balance suns and moons, never three in a row.', emoji: '☀️' },
  { type: 'zip', name: 'Path Link', desc: 'Draw one path through every cell, checkpoints in order.', emoji: '🔗' },
  { type: 'thread', name: 'Common Thread', desc: 'Find the one category connecting four clues.', emoji: '🧵' },
];
export function gameName(type: GameType): string { return GAMES.find((g) => g.type === type)?.name || type; }
export function computeStats(history: Store['history']) {
  const completed = history.filter((r) => r.completed);
  const dates = [...new Set(completed.map((r) => r.completedAt?.slice(0, 10) || ''))].filter(Boolean).sort();
  let streak = 0; const today = utcDateString(); const dateSet = new Set(dates);
  let cursor = dateSet.has(today) ? new Date(today) : new Date(new Date(today).getTime() - 86400000);
  // If neither today nor yesterday has a completion, streak is 0.
  if (!dateSet.has(today) && !dateSet.has(utcDateString(cursor))) streak = 0;
  else { while (dateSet.has(cursor.toISOString().slice(0, 10))) { streak++; cursor = new Date(cursor.getTime() - 86400000); } }
  let longest = 0, run = 0, prev: string | null = null;
  for (const d of dates) {
    if (prev && new Date(d).getTime() - new Date(prev).getTime() === 86400000) run++; else run = 1;
    longest = Math.max(longest, run); prev = d;
  }
  const totalMoves = completed.reduce((a, r) => a + r.moves, 0); const totalMistakes = completed.reduce((a, r) => a + r.mistakes, 0);
  const accuracy = totalMoves > 0 ? Math.max(0, (totalMoves - totalMistakes) / totalMoves) : 0;
  return {
    total: history.length, completed: completed.length,
    rate: history.length ? completed.length / history.length : 0,
    avgTime: completed.length ? completed.reduce((a, r) => a + r.elapsedSec, 0) / completed.length : 0,
    accuracy, streak, longest, bestScore: completed.length ? Math.max(...completed.map((r) => r.score)) : 0,
  };
}
export interface Achievement { id: string; name: string; desc: string; unlocked: (s: ReturnType<typeof computeStats>, history: Store['history']) => boolean; progress: (s: ReturnType<typeof computeStats>, history: Store['history']) => string }
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-win', name: 'First Win', desc: 'Complete any puzzle.', unlocked: (s) => s.completed >= 1, progress: (s) => `${Math.min(s.completed, 1)}/1` },
  { id: 'five-wins', name: 'Five Wins', desc: 'Complete 5 puzzles.', unlocked: (s) => s.completed >= 5, progress: (s) => `${Math.min(s.completed, 5)}/5` },
  { id: 'ten-wins', name: 'Ten Wins', desc: 'Complete 10 puzzles.', unlocked: (s) => s.completed >= 10, progress: (s) => `${Math.min(s.completed, 10)}/10` },
  { id: 'streak-3', name: '3-Day Streak', desc: 'Complete a puzzle on 3 consecutive days.', unlocked: (s) => s.longest >= 3, progress: (s) => `${Math.min(s.longest, 3)}/3` },
  { id: 'streak-7', name: '7-Day Streak', desc: 'Complete a puzzle on 7 consecutive days.', unlocked: (s) => s.longest >= 7, progress: (s) => `${Math.min(s.longest, 7)}/7` },
  { id: 'no-hints', name: 'Pure Logic', desc: 'Win a puzzle without using any hints.', unlocked: (_, h) => h.some((r) => r.completed && r.hints === 0), progress: (_, h) => h.some((r) => r.completed && r.hints === 0) ? '1/1' : '0/1' },
  { id: 'speed', name: 'Speed Demon', desc: 'Win a puzzle in under 60 seconds.', unlocked: (_, h) => h.some((r) => r.completed && r.elapsedSec < 60), progress: (_, h) => h.some((r) => r.completed && r.elapsedSec < 60) ? '1/1' : '0/1' },
  { id: 'all-games', name: 'Well Rounded', desc: 'Complete all four game types.', unlocked: (_, h) => new Set(h.filter((r) => r.completed).map((r) => r.game)).size >= 4, progress: (_, h) => `${new Set(h.filter((r) => r.completed).map((r) => r.game)).size}/4` },
  { id: 'daily', name: 'Daily Player', desc: 'Complete a daily challenge.', unlocked: (_, h) => h.some((r) => r.completed && r.mode === 'daily'), progress: (_, h) => h.some((r) => r.completed && r.mode === 'daily') ? '1/1' : '0/1' },
];
export function unlockedAchievements(history: Store['history']): string[] {
  const s = computeStats(history); return ACHIEVEMENTS.filter((a) => a.unlocked(s, history)).map((a) => a.id);
}

export function HomeView(p: ViewProps) {
  const s = computeStats(p.store.history); const today = utcDateString();
  const dailyDone = (game: GameType) => p.store.history.some((r) => r.completed && r.mode === 'daily' && r.game === game && r.completedAt?.slice(0, 10) === today);
  return (
    <div className="grid">
      <div className="hero"><h1>{t(p.lang, 'welcome')}</h1><p>{t(p.lang, 'tagline')}</p>
        <div className="row"><span className="badge">🔥 {t(p.lang, 'streak')}: {s.streak} days</span><span className="badge">Completed: {s.completed}</span><span className="badge">Best: {s.bestScore}</span></div>
      </div>
      <Card><h2>{t(p.lang, 'dailyChallenge')}</h2><p className="muted small">One deterministic puzzle per game, per day (UTC). Same puzzle for everyone on the same date.</p>
        <div className="grid grid2">{GAMES.map((g) => (
          <div key={g.type} className="row" style={{ justifyContent: 'space-between' }}><span>{g.emoji} {g.name} {dailyDone(g.type) ? '✅' : ''}</span>
            <button className="btn primary" onClick={() => p.startGame(g.type, 'daily', 'medium')}>{dailyDone(g.type) ? 'Play again' : t(p.lang, 'play')}</button></div>
        ))}</div>
      </Card>
      {p.store.currentSession && (
        <Card><h2>{t(p.lang, 'continue')}</h2><p className="muted">Resume your saved {gameName(p.store.currentSession.game)} game.</p>
          <button className="btn primary" onClick={p.resume}>{t(p.lang, 'continue')}</button></Card>
      )}
      <Card><h2>Quick Play</h2><div className="grid grid2">{GAMES.map((g) => (
        <div key={g.type}><p><strong>{g.emoji} {g.name}</strong></p><p className="muted small">{g.desc}</p>
          <button className="btn primary" onClick={() => p.startGame(g.type, 'free', p.store.settings.defaultDifficulty)}>{t(p.lang, 'play')}</button></div>
      ))}</div></Card>
      <AdsBanner premium={p.store.premium.status === 'premium'} adsEnabled={import.meta.env.VITE_ADS_ENABLED === 'true' && p.store.settings.adsConsent} />
    </div>
  );
}

export function LibraryView(p: ViewProps) {
  const [diff, setDiff] = useState<Difficulty>(p.store.settings.defaultDifficulty);
  const [tut, setTut] = useState<GameType | null>(null);
  return (
    <div>
      <h1>{t(p.lang, 'library')}</h1>
      <label>Difficulty <select value={diff} onChange={(e) => setDiff(e.target.value as Difficulty)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
      <div className="grid grid2" style={{ marginTop: '1rem' }}>{GAMES.map((g) => (
        <Card key={g.type}><h2>{g.emoji} {g.name}</h2><p className="muted">{g.desc}</p>
          <div className="row"><button className="btn primary" onClick={() => p.startGame(g.type, 'free', diff)}>{t(p.lang, 'play')}</button>
            <button className="btn" onClick={() => setTut(g.type)}>How to play</button>
            <button className="btn" onClick={() => p.startGame(g.type, 'daily', diff)}>Daily</button></div></Card>
      ))}</div>
      {tut && <Modal title={`How to play: ${gameName(tut)}`} onClose={() => setTut(null)}>{TUTORIALS[tut]}<button className="btn primary" onClick={() => { setTut(null); p.startGame(tut, 'free', diff); }}>Play now</button></Modal>}
    </div>
  );
}

export function DailyView(p: ViewProps) {
  const today = utcDateString();
  const done = (game: GameType) => p.store.history.some((r) => r.completed && r.mode === 'daily' && r.game === game && r.completedAt?.slice(0, 10) === today);
  return (
    <div><h1>{t(p.lang, 'dailyChallenge')} — {today}</h1><p className="muted">Daily puzzle IDs are deterministic: {dailyPuzzleId('queens', today)} and equivalents for other games. They do not depend on your device clock for scoring — completion is recorded with the server-independent UTC date.</p>
      <div className="grid grid2">{GAMES.map((g) => (
        <Card key={g.type}><h2>{g.emoji} {g.name}</h2><p>{done(g.type) ? '✅ Completed today' : 'Not completed yet'}</p>
          <button className="btn primary" onClick={() => p.startGame(g.type, 'daily', 'medium')}>{done(g.type) ? 'Play again' : 'Play daily'}</button></Card>
      ))}</div>
    </div>
  );
}

export function HistoryView(p: ViewProps) {
  const [game, setGame] = useState<string>('all'); const [diff, setDiff] = useState<string>('all'); const [confirmClear, setConfirmClear] = useState(false);
  const list = useMemo(() => p.store.history.filter((r) => (game === 'all' || r.game === game) && (diff === 'all' || r.difficulty === diff))
    .sort((a, b) => (b.completedAt || b.startedAt).localeCompare(a.completedAt || a.startedAt)), [p.store.history, game, diff]);
  function download() {
    const blob = new Blob([exportStoreJson(p.store)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'puzzleverse-export.json'; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div><h1>{t(p.lang, 'history')}</h1>
      <div className="row">
        <select value={game} onChange={(e) => setGame(e.target.value)}><option value="all">All games</option>{GAMES.map((g) => <option key={g.type} value={g.type}>{g.name}</option>)}</select>
        <select value={diff} onChange={(e) => setDiff(e.target.value)}><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <button className="btn" onClick={download}>Export JSON</button>
        <button className="btn" onClick={() => setConfirmClear(true)}>Clear history</button>
      </div>
      {list.length === 0 ? <Card><p className="muted">No games yet. Your completed and attempted games will appear here — only real records, never invented ones.</p></Card> : (
        <table><thead><tr><th>Date</th><th>Game</th><th>Difficulty</th><th>Result</th><th>Time</th><th>Score</th></tr></thead>
          <tbody>{list.map((r) => <tr key={r.id}><td>{(r.completedAt || r.startedAt).slice(0, 10)}</td><td>{gameName(r.game)}</td><td>{r.difficulty}</td><td>{r.completed ? '✅ Complete' : 'Incomplete'}</td><td>{formatTime(r.elapsedSec)}</td><td>{r.score}</td></tr>)}</tbody></table>
      )}
      {confirmClear && <Confirm message="Delete all local game history? This cannot be undone." onOk={() => { p.update((s) => { s.history = []; }); setConfirmClear(false); }} onCancel={() => setConfirmClear(false)} />}
    </div>
  );
}

export function StatsView(p: ViewProps) {
  const s = computeStats(p.store.history);
  const last28 = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of p.store.history.filter((x) => x.completed)) counts.set(r.completedAt!.slice(0, 10), (counts.get(r.completedAt!.slice(0, 10)) || 0) + 1);
    const out: { date: string; count: number }[] = [];
    for (let i = 27; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10); out.push({ date: d, count: counts.get(d) || 0 }); }
    return out;
  }, [p.store.history]);
  const best = (game: GameType) => { const c = p.store.history.filter((r) => r.game === game && r.completed); return c.length ? Math.max(...c.map((r) => r.score)) : 0; };
  return (
    <div><h1>{t(p.lang, 'stats')}</h1>
      <div className="grid grid3">
        <Card><p className="stat">{s.completed} / {s.total}</p><p className="muted">Completed / played ({Math.round(s.rate * 100)}%)</p></Card>
        <Card><p className="stat">{Math.round(s.avgTime)}s</p><p className="muted">Average solving time</p></Card>
        <Card><p className="stat">{Math.round(s.accuracy * 100)}%</p><p className="muted">Accuracy (moves without a counted mistake)</p></Card>
        <Card><p className="stat">{s.streak} days</p><p className="muted">Current streak (longest: {s.longest})</p></Card>
      </div>
      <Card><h2>Personal bests</h2>{GAMES.map((g) => <p key={g.type}>{g.name}: {best(g.type)} points</p>)}</Card>
      <Card><h2>Activity — last 28 days</h2><div className="row">{last28.map((d) => <div key={d.date} title={`${d.date}: ${d.count}`} style={{ width: 18, height: 18, borderRadius: 4, background: d.count === 0 ? 'var(--border)' : d.count === 1 ? 'var(--accent)' : '#15803d', opacity: d.count === 0 ? 0.6 : 1 }} />)}</div><p className="small muted">Each square is one day. Darker squares mean more completed games that day.</p></Card>
    </div>
  );
}

export function AchievementsView(p: ViewProps) {
  const s = computeStats(p.store.history);
  return (
    <div><h1>{t(p.lang, 'achievements')}</h1><div className="grid grid2">{ACHIEVEMENTS.map((a) => {
      const unlocked = a.unlocked(s, p.store.history);
      return <Card key={a.id}><h3>{unlocked ? '🏆' : '🔒'} {a.name}</h3><p className="muted small">{a.desc}</p><p>{unlocked ? 'Unlocked' : `Progress: ${a.progress(s, p.store.history)}`}</p></Card>;
    })}</div></div>
  );
}

export function LeaderboardView(p: ViewProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const local = localLeaderboard(p.store.history, p.store.profile.name);
  return (
    <div><h1>{t(p.lang, 'leaderboard')}</h1><p className="muted"><strong>Local leaderboard only.</strong> These are your real local scores. The server leaderboard is not configured and is not faked with invented players.</p>
      {local.length === 0 ? <Card><p className="muted">No completed games yet, so there is no leaderboard yet.</p></Card> : (
        <table><thead><tr><th>Rank</th><th>Player</th><th>Game</th><th>Score</th></tr></thead>
          <tbody>{local.map((e) => <tr key={e.rank}><td>{e.rank}</td><td>{e.name}</td><td>{gameName(e.game as GameType)}</td><td>{e.score}</td></tr>)}</tbody></table>
      )}
      <button className="btn" style={{ marginTop: '1rem' }} onClick={async () => { try { await remoteApi.fetchLeaderboard(); } catch (e) { setServerError(e instanceof Error ? e.message : String(e)); } }}>Try server leaderboard</button>
      {serverError && <p className="err">{serverError}</p>}
    </div>
  );
}

export function ProfileView(p: ViewProps) {
  const [name, setName] = useState(p.store.profile.name); const [bio, setBio] = useState(p.store.profile.bio); const [avatar, setAvatar] = useState(p.store.profile.avatar);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [authError, setAuthError] = useState<string | null>(null); const [authMsg, setAuthMsg] = useState<string | null>(null);
  const adapter = browserAdapter();
  async function auth(kind: 'register' | 'login') {
    setAuthError(null); setAuthMsg(null);
    try {
      const acc = kind === 'register' ? await registerAccount((k) => adapter.get(k), (k, v) => adapter.set(k, v), name, email, password)
        : await loginAccount((k) => adapter.get(k), email, password);
      p.update((s) => { s.profile = { ...s.profile, id: acc.id, name: acc.name, email: acc.email, isGuest: false }; });
      setAuthMsg(kind === 'register' ? 'Local account created. Your existing local history was kept.' : 'Signed in locally. Your existing local history was kept.');
    } catch (e) { setAuthError(e instanceof Error ? e.message : String(e)); }
  }
  return (
    <div><h1>{t(p.lang, 'profile')}</h1>
      <Card><p>{p.store.profile.isGuest ? 'Guest account — progress is stored on this device.' : `Signed in locally as ${p.store.profile.email || p.store.profile.name}. This is local-only auth, not server auth.`}</p>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label style={{ display: 'block', marginTop: '.75rem' }}>Avatar
          <select value={avatar} onChange={(e) => setAvatar(e.target.value)}>{['🧩', '🎲', '👑', '☀️', '🌙', '🧠', '🐱', '🐶', '🦊', '🐼'].map((a) => <option key={a} value={a}>{a}</option>)}</select></label>
        <label style={{ display: 'block', marginTop: '.75rem' }}>Bio<textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /></label>
        <button className="btn primary" style={{ marginTop: '.75rem' }} onClick={() => p.update((s) => { s.profile.name = name; s.profile.bio = bio; s.profile.avatar = avatar; })}>Save profile</button>
      </Card>
      <Card><h2>Local account</h2><p className="muted small">Guest progress is kept when you sign in locally, because history lives in the same local store. No data is sent to a server.</p>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label style={{ display: 'block', marginTop: '.75rem' }}>Password (min 6 characters)<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <div className="row" style={{ marginTop: '.75rem' }}><button className="btn primary" onClick={() => auth('register')}>{t(p.lang, 'signUp')}</button><button className="btn" onClick={() => auth('login')}>{t(p.lang, 'signIn')}</button>
          {!p.store.profile.isGuest && <button className="btn" onClick={() => p.update((s) => { s.profile = { ...s.profile, isGuest: true, name: 'Guest Player', email: undefined }; })}>{t(p.lang, 'signOut')}</button>}</div>
        {authError && <p className="err">{authError}</p>}{authMsg && <p className="ok">{authMsg}</p>}
        <p className="small muted">Password reset: there is no server to email you. To recover a local account, use the Privacy screen to delete local data and start again — that is the honest local-only recovery path.</p>
      </Card>
    </div>
  );
}

export function FriendsView(p: ViewProps) {
  const [name, setName] = useState('');
  return (
    <div><h1>{t(p.lang, 'friends')}</h1><p className="muted"><strong>Local only.</strong> Remote friends are not configured. These friends live only on this device.</p>
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; p.update((s) => { s.friends.push({ id: `f-${Date.now()}`, name: name.trim(), avatar: '🧑' }); }); setName(''); }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Friend's name" aria-label="Friend's name" style={{ flex: 1 }} />
        <button className="btn primary" type="submit">Add friend</button>
      </form>
      <div className="grid grid2" style={{ marginTop: '1rem' }}>{p.store.friends.length === 0 ? <Card><p className="muted">No local friends yet.</p></Card> : p.store.friends.map((f) => (
        <Card key={f.id}><p>{f.avatar} {f.name}</p><button className="btn" onClick={() => p.update((s) => { s.friends = s.friends.filter((x) => x.id !== f.id); })}>Remove</button></Card>
      ))}</div>
    </div>
  );
}

export function NotificationsView(p: ViewProps) {
  return (
    <div><h1>{t(p.lang, 'notifications')}</h1>
      <Card><p className="muted">Toggles live in Settings. If a toggle is off, that kind of notification is not generated.</p>
        <button className="btn" onClick={() => p.update((s) => { s.notifications = s.notifications.map((n) => ({ ...n, read: true })); })}>Mark all read</button></Card>
      {p.store.notifications.length === 0 ? <Card><p className="muted">No notifications yet. Complete a puzzle to unlock an achievement notification.</p></Card> : p.store.notifications.map((n) => (
        <Card key={n.id}><p><strong>{n.read ? '' : '● '}{n.title}</strong></p><p className="muted small">{n.body} — {n.date.slice(0, 10)}</p></Card>
      ))}
    </div>
  );
}

export function SettingsView(p: ViewProps) {
  const s = p.store.settings;
  const set = (patch: Partial<typeof s>) => p.update((st) => { st.settings = { ...st.settings, ...patch }; });
  return (
    <div><h1>{t(p.lang, 'settings')}</h1>
      <Card><h2>Gameplay</h2>
        <div className="toggle"><span>Sound effects</span><input type="checkbox" checked={s.sound} onChange={(e) => set({ sound: e.target.checked })} /></div>
        <div className="toggle"><span>Show timer</span><input type="checkbox" checked={s.showTimer} onChange={(e) => set({ showTimer: e.target.checked })} /></div>
        <div className="toggle"><span>Show move counter</span><input type="checkbox" checked={s.showMoves} onChange={(e) => set({ showMoves: e.target.checked })} /></div>
        <div className="toggle"><span>Confirm before using a hint</span><input type="checkbox" checked={s.hintConfirmation} onChange={(e) => set({ hintConfirmation: e.target.checked })} /></div>
        <label>Default game<select value={s.defaultGame} onChange={(e) => set({ defaultGame: e.target.value as GameType })}>{GAMES.map((g) => <option key={g.type} value={g.type}>{g.name}</option>)}</select></label>
        <label style={{ display: 'block', marginTop: '.75rem' }}>Preferred difficulty<select value={s.defaultDifficulty} onChange={(e) => set({ defaultDifficulty: e.target.value as Difficulty })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
        <p className="small muted">Haptic feedback, background music, and auto-resume of the exact board are platform-dependent: haptics/music are not implemented in this web build (see docs/INCOMPLETE.md); the current session is saved locally and can be continued from Home.</p>
      </Card>
      <Card><h2>Appearance</h2>
        <label>Theme<select value={s.theme} onChange={(e) => set({ theme: e.target.value as typeof s.theme })}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label>
        <label style={{ display: 'block', marginTop: '.75rem' }}>Accent colour<select value={s.accent} onChange={(e) => set({ accent: e.target.value })}>{Object.entries(ACCENTS).map(([name, hex]) => <option key={name} value={hex}>{name}</option>)}</select></label>
        <label style={{ display: 'block', marginTop: '.75rem' }}>Board style<select value={s.boardStyle} onChange={(e) => set({ boardStyle: e.target.value as typeof s.boardStyle })}><option value="classic">Classic</option><option value="soft">Soft (rounded)</option><option value="contrast">High contrast borders</option></select></label>
        <label style={{ display: 'block', marginTop: '.75rem' }}>Text size<select value={s.textSize} onChange={(e) => set({ textSize: e.target.value as typeof s.textSize })}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label>
        <div className="toggle"><span>Reduced motion</span><input type="checkbox" checked={s.reducedMotion} onChange={(e) => set({ reducedMotion: e.target.checked })} /></div>
      </Card>
      <Card><h2>Language &amp; notifications</h2>
        <label>Language<select value={s.language} onChange={(e) => set({ language: e.target.value as Lang })}><option value="en">English</option><option value="id">Bahasa Indonesia</option></select></label>
        <div className="toggle"><span>Daily challenge reminders</span><input type="checkbox" checked={s.notifyDaily} onChange={(e) => set({ notifyDaily: e.target.checked })} /></div>
        <div className="toggle"><span>Streak reminders</span><input type="checkbox" checked={s.notifyStreak} onChange={(e) => set({ notifyStreak: e.target.checked })} /></div>
        <div className="toggle"><span>Achievement notifications</span><input type="checkbox" checked={s.notifyAchievements} onChange={(e) => set({ notifyAchievements: e.target.checked })} /></div>
        <p className="small muted">Push notifications require a platform notification service and are not implemented in this web build; in-app notifications above respect these toggles.</p>
      </Card>
      <Card><h2>Privacy</h2>
        <div className="toggle"><span>Analytics consent (local only, nothing is sent)</span><input type="checkbox" checked={s.analyticsConsent} onChange={(e) => set({ analyticsConsent: e.target.checked })} /></div>
        <div className="toggle"><span>Advertising consent (placeholder ads only)</span><input type="checkbox" checked={s.adsConsent} onChange={(e) => set({ adsConsent: e.target.checked })} /></div>
      </Card>
    </div>
  );
}

export function PremiumView(p: ViewProps) {
  const [msg, setMsg] = useState<string | null>(null); const isPremium = p.store.premium.status === 'premium';
  return (
    <div><h1>{t(p.lang, 'premium')}</h1>
      <Card><h2>{isPremium ? 'You have Premium (local status)' : 'Go Premium'}</h2>
        <ul><li>Completely ad-free gameplay and navigation</li><li>Premium themes and board styles</li><li>Advanced statistics and historical insights</li><li>Additional puzzle packs and customisation</li></ul>
        <p>Pricing (configurable in src/config.ts): {CONFIG.premium.monthlyLabel} {CONFIG.premium.monthlyPrice} • {CONFIG.premium.yearlyLabel} {CONFIG.premium.yearlyPrice}. Core game rules stay fair — no pay-to-win mechanics.</p>
        {!isPremium && <div className="row"><button className="btn primary" onClick={() => { const r = buyPremiumProduction(); setMsg(r.message); }}>Buy monthly</button><button className="btn" onClick={() => { const r = buyPremiumProduction(); setMsg(r.message); }}>Buy yearly</button></div>}
        {isPremium && <button className="btn" onClick={() => { p.update((s) => { s.premium = { status: 'free', source: null }; }); setMsg('Premium cancelled locally.'); }}>Cancel premium (local)</button>}
        <button className="btn" style={{ marginLeft: '.5rem' }} onClick={() => setMsg(isPremium ? 'Purchases restored locally (dev-mock source only).' : 'Restore purchases is not configured for a real store yet. See docs/INCOMPLETE.md. No entitlement was granted.')}>Restore purchases</button>
        {canUseMockPremium() && !isPremium && <div style={{ marginTop: '1rem' }}><p className="warn"><strong>DEV ONLY:</strong> this button exists only in a development build and never runs in production.</p><button className="btn" onClick={() => { p.update((s) => { s.premium = { status: 'premium', source: 'dev-mock' }; }); setMsg('Dev-mock premium enabled. This must never grant production entitlements.'); }}>Enable dev-mock premium (DEV only)</button></div>}
        {msg && <p>{msg}</p>}
      </Card>
    </div>
  );
}

export function PrivacyView(p: ViewProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  function download() {
    const blob = new Blob([exportStoreJson(p.store)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'puzzleverse-export.json'; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div><h1>{t(p.lang, 'privacy')}</h1>
      <Card><h2>What is stored, and why</h2><p className="muted">Only gameplay records, preferences, profile details you enter, local friends, and feedback you submit — all on this device, in localStorage. Nothing is sent to a server in this build. Analytics consent only gates local behaviour; no telemetry is transmitted.</p>
        <div className="row"><button className="btn primary" onClick={download}>Export my data (JSON)</button><button className="btn" onClick={() => setConfirmDelete(true)}>Delete my account &amp; local data</button></div>
      </Card>
      <Card><h2>Privacy policy &amp; terms (templates)</h2><p className="muted">Full templates are in docs/PRIVACY.md and docs/TERMS.md. They are templates for legal review, not a substitute for a lawyer. In short: we do not sell personal data, we do not collect data you did not enter, and you can export or delete your local data at any time from this screen.</p>
        <button className="btn" onClick={() => p.navigate('about')}>Read About &amp; Legal</button></Card>
      {confirmDelete && <Confirm message="Delete your local account, history, friends and settings? This cannot be undone." onOk={() => {
        const adapter = browserAdapter(); adapter.remove('puzzleverse-store-v1'); adapter.remove('puzzleverse-accounts-v1');
        window.location.reload();
      }} onCancel={() => setConfirmDelete(false)} />}
    </div>
  );
}

export function HelpView(p: ViewProps) {
  const [tut, setTut] = useState<GameType | null>(null); const [feedback, setFeedback] = useState(''); const [sent, setSent] = useState(false);
  return (
    <div><h1>{t(p.lang, 'help')}</h1>
      <Card><h2>Tutorials</h2><div className="row">{GAMES.map((g) => <button key={g.type} className="btn" onClick={() => setTut(g.type)}>{g.name} tutorial</button>)}</div></Card>
      <Card><h2>FAQ</h2>
        <details><summary>Is my progress saved if I close the app mid-puzzle?</summary><p>Yes. The current session is saved locally on every move, and completed games are written to history immediately.</p></details>
        <details><summary>Do I need an account?</summary><p>No. Guest play works fully offline. A local account only renames your local profile; it does not sync to a server.</p></details>
        <details><summary>Why do I not see a server leaderboard?</summary><p>Because no server is configured in this build. The leaderboard shows your real local scores only.</p></details>
        <details><summary>How do daily challenges work?</summary><p>Each day (UTC) generates a deterministic puzzle per game from the date. The same date gives the same puzzle, and completion is recorded for that date.</p></details>
      </Card>
      <Card><h2>Feedback</h2><p className="muted small">Feedback is stored locally on this device only.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (!feedback.trim()) return; p.update((s) => { s.feedback.push({ id: `fb-${Date.now()}`, text: feedback.trim(), date: new Date().toISOString() }); }); setFeedback(''); setSent(true); }}>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Tell us what worked, what did not, or what to improve…" />
          <button className="btn primary" type="submit" style={{ marginTop: '.5rem' }}>Send feedback</button>
        </form>
        {sent && <p className="ok">Thank you — your feedback was saved locally.</p>}
      </Card>
      {tut && <Modal title={`${gameName(tut)} tutorial`} onClose={() => setTut(null)}>{TUTORIALS[tut]}<button className="btn primary" onClick={() => { const t2 = tut; setTut(null); p.startGame(t2, 'free', p.store.settings.defaultDifficulty); }}>Play this game</button></Modal>}
    </div>
  );
}

export function AboutView(p: ViewProps) {
  return (
    <div><h1>{t(p.lang, 'about')}</h1>
      <Card><h2>{CONFIG.appName} — version {CONFIG.version}</h2>
        <p className="muted">A production-oriented, offline-first puzzle platform with four original games. Branding, colours and bundle identifiers are configurable in src/config.ts.</p>
        <p>Bundle identifiers (placeholders, change before store submission): Android {CONFIG.androidPackage}, iOS {CONFIG.iosBundleId}, Windows {CONFIG.windowsAppId}.</p>
        <p><strong>Honest build status:</strong> the web build (Vite) is verified in this environment. Tauri desktop/Android/iOS builds were NOT run here — this Linux VM has no Rust toolchain, Xcode, or Android SDK/NDK — see docs/packaging.md for the exact steps and requirements.</p>
        <p><strong>Legal templates:</strong> docs/PRIVACY.md and docs/TERMS.md are templates for legal review, not completed legal advice. No store approval, purchase configuration, or certification is claimed.</p>
      </Card>
      <Card><h2>Support</h2><p className="muted">Support contact is a placeholder to be configured by the publisher before release: support@puzzleverse.example (see docs/RELEASE.md).</p></Card>
    </div>
  );
}
