// Tauri 2 entry point (placeholder shell — see docs/packaging.md).
// The web frontend in ../src is the application; this binary only hosts it.
// Desktop/Android/iOS builds were NOT run in this Linux VM (no Rust, Xcode,
// or Android SDK/NDK here), so no native artifact is claimed.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() { tauri::Builder::default().run(tauri::generate_context!()).expect("error while running tauri application"); }
