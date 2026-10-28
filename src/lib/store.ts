// Versioned, offline-first local store. localStorage in the app, an
// injectable adapter in tests. Migrations are pure functions.
import type { Difficulty, GameRecord, GameType } from '../games/types';
import type { Lang } from '../i18n';
export const STORE_VERSION = 2;
export const STORE_KEY = 'puzzleverse-store-v1';
export interface Settings {
  theme: 'light' | 'dark' | 'system'; accent: string; boardStyle: 'classic' | 'soft' | 'contrast';
  textSize: 'small' | 'medium' | 'large'; reducedMotion: boolean; sound: boolean;
  showTimer: boolean; showMoves: boolean; hintConfirmation: boolean;
  language: Lang; defaultGame: GameType; defaultDifficulty: Difficulty;
  notifyDaily: boolean; notifyStreak: boolean; notifyAchievements: boolean;
  analyticsConsent: boolean; adsConsent: boolean;
}
export interface Profile { id: string; name: string; avatar: string; bio: string; isGuest: boolean; email?: string }
export interface Friend { id: string; name: string; avatar: string }
export interface AppNotification { id: string; title: string; body: string; date: string; read: boolean }
export interface CurrentSession {
  game: GameType; mode: 'daily' | 'free'; difficulty: Difficulty; puzzleId: string;
  puzzle: unknown; state: unknown; elapsedSec: number; moves: number; hints: number; mistakes: number; startedAt: string;
}
export interface Store {
  version: number; profile: Profile; settings: Settings; history: GameRecord[];
  friends: Friend[]; notifications: AppNotification[]; tutorialsSeen: Record<string, boolean>;
  feedback: { id: string; text: string; date: string }[]; currentSession: CurrentSession | null;
  premium: { status: 'free' | 'premium'; source: string | null };
}
export const defaultSettings = (): Settings => ({
  theme: 'system', accent: '#7c5cff', boardStyle: 'classic', textSize: 'medium', reducedMotion: false,
  sound: true, showTimer: true, showMoves: true, hintConfirmation: true, language: 'en',
  defaultGame: 'queens', defaultDifficulty: 'medium', notifyDaily: true, notifyStreak: true,
  notifyAchievements: true, analyticsConsent: false, adsConsent: false,
});
export function initialStore(): Store {
  return {
    version: STORE_VERSION,
    profile: { id: 'guest-1', name: 'Guest Player', avatar: '🧩', bio: '', isGuest: true },
    settings: defaultSettings(), history: [], friends: [], notifications: [],
    tutorialsSeen: {}, feedback: [], currentSession: null, premium: { status: 'free', source: null },
  };
}
// Migration: v1 stored history under `games` and had no premium field.
// v0/v1 -> v2 normalises those shapes without losing records.
export function migrate(raw: unknown): Store {
  const base = initialStore();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const history = Array.isArray(r.history) ? (r.history as GameRecord[]) : Array.isArray(r.games) ? (r.games as GameRecord[]) : [];
  return {
    ...base,
    ...(r as Partial<Store>),
    version: STORE_VERSION,
    settings: { ...base.settings, ...((r.settings as Partial<Settings>) || {}) },
    profile: { ...base.profile, ...((r.profile as Partial<Profile>) || {}) },
    history,
    premium: (r.premium as Store['premium']) || base.premium,
  };
}
export interface StorageAdapter { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void }
export function memoryAdapter(): StorageAdapter {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => { m.set(k, v); }, remove: (k) => { m.delete(k); } };
}
export function browserAdapter(): StorageAdapter {
  try {
    return {
      get: (k) => window.localStorage.getItem(k),
      set: (k, v) => { window.localStorage.setItem(k, v); },
      remove: (k) => { window.localStorage.removeItem(k); },
    };
  } catch { return memoryAdapter(); }
}
export function loadStore(adapter: StorageAdapter): Store {
  try { const raw = adapter.get(STORE_KEY); if (!raw) return initialStore(); return migrate(JSON.parse(raw)); }
  catch { return initialStore(); }
}
export function saveStore(adapter: StorageAdapter, store: Store): void {
  try { adapter.set(STORE_KEY, JSON.stringify(store)); } catch { /* storage full/blocked: gameplay continues in memory */ }
}
export function exportStoreJson(store: Store): string { return JSON.stringify(store, null, 2); }
