// Tauri 2 mobile entry point (Android/iOS).
// Desktop builds use main.rs, which calls run() below.
// Without this file, `cargo tauri android build` cannot produce
// the shared library Android expects, and the build fails.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
