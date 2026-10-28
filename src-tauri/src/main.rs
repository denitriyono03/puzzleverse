// Tauri 2 entry point for desktop (non-mobile).
// The actual app logic lives in lib.rs so Android/iOS can use it
// as a shared library via the mobile entry point.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    puzzleverse_lib::run();
}
