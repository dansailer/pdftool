// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::time::Duration;

mod pdf_merger;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_i18n::init(None))
        .plugin(
            tauri_plugin_updater::Builder::new()
                // Increase timeout to 60 seconds for slow connections
                .timeout(Duration::from_secs(60))
                // Disable proxy to avoid Windows proxy detection hanging
                .no_proxy()
                .build(),
        )
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .build(),
        )
        .invoke_handler(tauri::generate_handler![pdf_merger::merge_pdfs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
