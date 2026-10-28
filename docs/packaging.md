# Cross-platform packaging (Tauri 2) — honest status

**Status in this environment: NOT BUILT.** This Linux VM has no Rust
toolchain, no Xcode, and no Android SDK/NDK, so the commands below were
not run here and no native artifact is claimed. The `src-tauri/` config
is a correct starting shell, not a verified build.

## Prerequisites (each platform)

- All: Node 20+, npm, Rust (rustup, stable), Tauri CLI (`cargo install tauri-cli` or `npm i -D @tauri-apps/cli`).
- Windows: Visual Studio Build Tools (C++), WebView2 runtime (present on modern Windows).
- Android: Android Studio / SDK + NDK, Java 17, `cargo install cargo-ndk`, and
  `rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android`.
- iOS: macOS + Xcode + an Apple Developer account, provisioning profiles,
  and `rustup target add aarch64-apple-ios`.

## Commands (once toolchains are installed)

```bash
npm install
npm run build
npx tauri dev            # desktop dev
npx tauri build          # Windows installer / .msi, .deb, .dmg per host OS
npx tauri android dev    # Android dev (requires Android SDK/NDK)
npx tauri android build  # Android App Bundle (AAB) for Google Play
npx tauri ios dev        # iOS dev (macOS + Xcode only)
npx tauri ios build      # iOS archive for App Store Connect (macOS + Xcode only)
```

## Platform notes

- Android: responsive layouts, touch targets, back-button handling, and
  lifecycle handling are implemented in the web UI; the Tauri Android
  shell must still be smoke-tested on a real device/emulator before release.
- iOS: safe-area insets are handled by the viewport-fit=cover meta tag and
  the responsive layout; signing, icons, and launch screens must be
  generated in Xcode before submission.
- Windows: the window is resizable (1100x750 default in tauri.conf.json),
  keyboard/mouse controls are standard web controls, and app data lives in
  the Tauri app-data directory when packaged.
- Icons/splash: `src-tauri/` references `icons/icon.png`, which is a
  placeholder path — generate real icons with `npx tauri icon` from a
  1024x1024 source before release.
