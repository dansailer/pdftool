// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod pdf_merger;

use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_i18n::init(None))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Debug)
                .level_for("tauri_plugin_updater", log::LevelFilter::Trace)
                .target(Target::new(TargetKind::Stdout))
                .target(Target::new(TargetKind::Webview))
                .build(),
        )
        .invoke_handler(tauri::generate_handler![pdf_merger::merge_pdfs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
