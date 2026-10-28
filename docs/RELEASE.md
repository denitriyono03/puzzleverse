# Release checklist (store submission preparation)

## Before any submission
- [ ] Change bundle identifiers in `src/config.ts` and `src-tauri/tauri.conf.json` to the publisher's real ids.
- [ ] Replace the WhatsApp-style placeholder support address in About (`support@puzzleverse.example`) with a real support contact.
- [ ] Generate real icons/splash: 1024x1024 source, `npx tauri icon`, platform launch screens.
- [ ] Legal review of docs/PRIVACY.md and docs/TERMS.md by a qualified lawyer for each target market.
- [ ] Privacy / data-safety disclosures: what is collected (in this build: nothing leaves the device), account types, data deletion path (Privacy screen), and ad/IAP declarations once those integrations exist.
- [ ] Age-rating questionnaire: puzzle game, no user-generated content in this build, no chat with strangers (friends are local only) — confirm with each store's questionnaire at submission time, do not guess a rating here.
- [ ] Signing: Google Play App Signing + upload key, Apple distribution certificate + provisioning profiles, Windows code signing certificate. These require the publisher's accounts and cannot be done from this environment.
- [ ] Versioning: bump `package.json` version and `src-tauri/tauri.conf.json` version together; keep a changelog / release notes (template below).

## Build verification (per platform, on the right machine)
- [ ] Web: `npm test` and `npm run build` pass.
- [ ] Windows: `npx tauri build` on Windows, install and launch, test resize, keyboard, shutdown.
- [ ] Android: `npx tauri android build`, install AAB/APK on a device, test back button, rotation, offline play, lifecycle (background/foreground).
- [ ] iOS: `npx tauri ios build` on macOS/Xcode, TestFlight smoke test, safe-area check on notch devices.

## Screenshot capture plan
Home, Library, each game board (one per game), Results, Statistics, Settings,
Premium, and Daily — in phone portrait, tablet, and desktop widths, in both
light and dark themes. Capture from the real app, not mockups.

## Release notes template
```
PuzzleVerse vX.Y.Z
- New: ...
- Fixed: ...
- Known issues: ...
```

## Store review checklist
- No placeholder purchase flow is presented as working.
- No server feature is presented as working while NotConfigured.
- Ads (when integrated) never interrupt gameplay or cover controls.
- Privacy policy and terms are linked from the app (About / Privacy screens).
