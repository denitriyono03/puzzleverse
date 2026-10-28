# Architecture

## Smallest viable architecture

Web-first, local-first. One React + TypeScript + Vite codebase is shared by
all platforms; Tauri 2 is the packaging shell for Windows/Android/iOS, not a
second implementation.

```
UI (App.tsx, views.tsx, components/)
  -> Game screens (games/GameComponents.tsx)
    -> Game engines (games/queens.ts, tango.ts, zip.ts, thread.ts)
       rules, generators, validators — no DOM, no React, fully tested
  -> Session + records (lib/store.ts)
  -> Interfaces (lib/api.ts, auth.ts, premium.ts)
       local implementations are real; remote implementations throw
       NotConfigured errors instead of pretending to work
```

## Key decisions

- **No router library:** view-state navigation keeps the bundle small and
  works identically in a browser, Tauri webview, and mobile webview.
- **No PixiJS:** all four boards are CSS/SVG-style grids. GPU rendering
  would not materially improve a turn-based grid puzzle, so it was omitted
  deliberately (do not add frameworks without a measured need).
- **No backend for v0.1:** gameplay, history, and preferences are local-first
  and work fully offline. Remote features are interfaces with a
  NotConfigured stub, so swapping in a real backend means implementing
  `RemoteApi` — not rewriting the UI.
- **Persistence:** versioned JSON in localStorage (`puzzleverse-store-v1`,
  current version 2). Migrations are pure functions in `lib/store.ts` and
  are tested (v1 `games` -> v2 `history`, premium field added).
- **Daily challenges:** seed = hash(`puzzleverse-daily-<game>-<UTC date>`).
  The same date + game always generates the same puzzle on any device.
  Completion is recorded with the UTC date, so duplicate daily completions
  for the same day are visible in history and streak logic counts days, not records.
- **Scoring:** see `src/games/scoring.ts` — base by difficulty + time bonus
  - hint penalty - mistake penalty, floored at 10 when complete, 0 when incomplete.
- **Accessibility:** semantic buttons, aria labels on board cells, focus
  outlines, reduced-motion support, light/dark themes, text-size scaling,
  and high-contrast board borders as a setting.

## Data model (local)

GameRecord: id, userId, game, puzzleId, seed, difficulty, mode, startedAt,
completedAt, elapsedSec, moves, hints, mistakes, score, completed.
Store: version, profile, settings, history, friends, notifications,
tutorialsSeen, feedback, currentSession, premium.
CurrentSession stores the exact board state on every move, so Home >
Continue resumes the saved puzzle after a restart or a crash.
