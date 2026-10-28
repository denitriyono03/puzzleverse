# PuzzleVerse

A production-oriented, offline-first casual puzzle platform with four original,
fully playable games: **Crown Grid** (Queens-style), **Sun & Moon** (Tango-style),
**Path Link** (Zip-style), and **Common Thread** (original word association).

Branding, colours, and bundle identifiers are configurable in `src/config.ts`.
No copyrighted game artwork or branding is used; all icons are CSS/SVG/emoji.

## What works (web build, verified here)

- All four games with validated rules, difficulty levels, hints (max 3, with
  confirmation if enabled), undo, reset, pause, restart, timer, move counter,
  mistakes, completion detection, results screens, and difficulty-adjusted scoring.
- Daily challenges: deterministic UTC-date puzzles, same puzzle for the same
  date and game; plus unlimited free play with seeded, reproducible puzzles.
- Local persistence (versioned localStorage, with migrations): guest play,
  history, statistics, achievements, streaks, activity calendar, preferences,
  friends (local only), notifications, and feedback — all surviving restarts.
- Settings that actually work: light/dark/system theme, accent colour, board
  style, text size, reduced motion, sound, timer/move visibility, hint
  confirmation, language (English / Bahasa Indonesia core UI), and notification toggles.
- Local-only account: guest by default, register/sign in locally with a
  SHA-256 hashed password (WebCrypto). This is **not** server auth.
- Premium: free vs premium states are distinguished and premium suppresses
  the (dev-only placeholder) ad banner. In production, buying does **not**
  grant entitlement — it shows "store purchase not configured".
- Leaderboard: local only, from real local history. No invented players.

## Commands

```bash
npm install
npm run dev      # Vite dev server, http://localhost:5173
npm test         # Vitest — 15 tests, all passing in this environment
npm run build    # tsc + vite build -> dist/
npm run preview  # serve the production build locally
```

## Honest build status (do not over-claim)

- **Web (Vite): built and verified** in this Linux VM: `dist/index.html`,
  CSS 4.55 kB, JS 209.10 kB (gzip 64.76 kB).
- **Windows / Android / iOS (Tauri 2): NOT built here.** This VM has no Rust
  toolchain, no Xcode, and no Android SDK/NDK, so no APK, AAB, IPA, MSI, or
  installer exists or is claimed. See `docs/packaging.md` for the exact steps.
- **Backend / server auth / remote sync / server leaderboard / real ads SDK /
  real in-app purchase: NOT CONFIGURED.** See `docs/INCOMPLETE.md`.

## Project structure

```
src/
  config.ts            # branding, pricing, bundle ids
  i18n.ts              # EN/ID dictionary for core UI strings
  lib/
    rng.ts             # seeded RNG, daily seeds
    store.ts           # versioned localStorage store + migrations
    auth.ts            # LOCAL-ONLY account (SHA-256, WebCrypto)
    api.ts             # RemoteApi interface + NotConfigured stub + local leaderboard
    premium.ts         # entitlement rules (client click never grants in production)
    sound.ts           # WebAudio beeps
  games/
    types.ts queens.ts tango.ts zip.ts thread.ts scoring.ts daily.ts
    GameComponents.tsx # playable boards + tutorial overlays
    *.test.ts          # rule, generation, scoring, daily, store tests
  components/          # Card, Modal, Confirm, AdsBanner, GameShell
  views.tsx            # all screens (Home, Library, Daily, History, Stats,
                       # Achievements, Leaderboard, Profile, Friends,
                       # Notifications, Settings, Premium, Privacy, Help, About)
  App.tsx              # view-state navigation, theme effects, session resume
src-tauri/             # Tauri 2 config (not built here)
docs/                  # ARCHITECTURE, API, RELEASE, INCOMPLETE, STORE_LISTING,
                       # PRIVACY, TERMS, packaging
```

## Configuration

Copy `.env.example` to `.env` if needed. `VITE_ADS_ENABLED` defaults to off;
the ad banner is a development placeholder only and is disabled in production
builds by default. Never put real secrets in the client or in `.env.example`.
