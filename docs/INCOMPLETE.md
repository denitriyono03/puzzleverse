# Incomplete integrations — exact remaining steps

Nothing below is claimed as done. Each item needs an external account,
approval, toolchain, or legal decision that this environment does not have.

1. **Tauri native builds (Windows/Android/iOS)** — NOT BUILT.
   Need: Rust toolchain, Xcode (iOS, macOS only), Android SDK/NDK (Android),
   Windows toolchain (Windows). Then run the commands in docs/packaging.md
   and smoke-test on real devices. No APK/AAB/IPA/MSI exists yet.

2. **Server authentication** — NOT CONFIGURED.
   Need: a backend auth provider, HTTPS API, password-reset email flow,
   session/token handling, and a privacy review. Current auth is local-only.

3. **Remote sync / cross-device sync** — NOT CONFIGURED.
   Need: implement `RemoteApi.syncRecords` against a real API, with
   idempotent writes, deduplication by record id, and conflict rules
   (last-write-wins per record id is the proposed starting rule).
   Until then, history stays on one device.

4. **Server leaderboard** — NOT CONFIGURED.
   Need: a server that validates scores/completions (never trust client
   scores alone), rate-limits submissions, and returns ranked entries.
   The in-app leaderboard is local only, by design.

5. **Real advertising SDK** — NOT CONFIGURED.
   Need: an ad account per platform, SDK integration, consent flow review,
   frequency caps, and remote config. Current banner is a dev placeholder,
   disabled in production by default, and never interrupts gameplay.

6. **Real in-app purchase / subscriptions** — NOT CONFIGURED.
   Need: Google Play Billing, Apple StoreKit, and a Windows entitlement
   strategy, plus server-side receipt/entitlement verification, restore,
   grace-period, and cancellation handling. Current premium screen
   deliberately grants nothing from a client click.

7. **Social login, remote friends, push notifications** — NOT CONFIGURED.
   Need: OAuth providers, a friends service, and a push service (FCM/APNs).
   Friends and notifications in-app are local only.

8. **Store approval** — NOT DONE.
   Need: developer accounts (Google Play, Apple, Microsoft), signing/
   provisioning, store listings (see docs/STORE_LISTING.md), privacy
   disclosures, age-rating questionnaires, and legal review of
   docs/PRIVACY.md and docs/TERMS.md (templates only).

9. **Haptic feedback, background music** — NOT IMPLEMENTED in this web build.
   Need: platform haptic APIs via Tauri plugins and a licensed music asset.
   Sound effects (WebAudio beeps) are implemented and toggleable.

10. **App icons / splash screens** — PLACEHOLDER PATH ONLY.
    Need: a 1024x1024 source icon, then `npx tauri icon`, plus platform
    launch-screen assets.
