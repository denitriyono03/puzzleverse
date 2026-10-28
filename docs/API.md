# API Documentation

## Local interfaces (implemented)

### Game engines — `src/games/*.ts`
- `generateQueens / generateTango / generateZip / generateThread(difficulty, seed, mode)`
- `validateQueens / validateTango / validateZip(grid|path, puzzle)` -> `{ valid, complete, errors }`
- `checkThreadAnswer(input, puzzle)` (case-insensitive, aliases)
- `computeScore({ difficulty, elapsedSec, hints, mistakes, completed })`
- `dailyPuzzle(game, difficulty?, date?)`, `dailyPuzzleId(game, date?)`

### Store — `src/lib/store.ts`
- `loadStore(adapter)`, `saveStore(adapter, store)`, `migrate(raw)`,
  `exportStoreJson(store)`, `memoryAdapter()`, `browserAdapter()`

### Auth (local only) — `src/lib/auth.ts`
- `registerAccount(get, set, name, email, password)` — SHA-256 + salt
- `loginAccount(get, email, password)`
- These never contact a server. Passwords are never stored in plaintext
  (only salt + hash, locally).

### Remote interface — `src/lib/api.ts`
```ts
interface RemoteApi {
  syncRecords(records: GameRecord[]): Promise<{ synced: number }>;
  fetchLeaderboard(): Promise<LeaderboardEntry[]>;
  verifyPurchase(receipt: string): Promise<boolean>;
}
```
Current implementation: `NotConfiguredApi` — every method throws
"Remote API is not configured." A real backend implements this interface
and replaces `remoteApi` in one place; game UI does not change.

### Premium / ads — `src/lib/premium.ts`, `components/ui.tsx`
- `buyPremiumProduction()` always returns `{ ok: false, message }` and grants nothing.
- `canUseMockPremium()` is true only when `import.meta.env.DEV` is true.
- `AdsBanner` renders only when premium is off, `VITE_ADS_ENABLED=true`,
  and the user has given advertising consent in Settings.

## Environment variables

See `.env.example`. No real secrets belong in the client. Server-side
purchase verification, if added later, must use a server-held secret —
never a client-embedded key.
