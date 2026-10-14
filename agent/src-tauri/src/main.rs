#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod sync;
mod tray;

// Re-use the lib modules
use devenv_agent::scanner;
use devenv_agent::types;

use std::time::Duration;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;
use tokio::time;

#[tauri::command]
async fn save_jwt(jwt: String, api_url: String, app: AppHandle) -> Result<(), String> {
    let mut cfg = config::AgentConfig::load();
    cfg.jwt = Some(jwt);
    cfg.api_url = api_url;
    cfg.save();
    run_sync(app).await;
    Ok(())
}

async fn run_sync(app: AppHandle) {
    let cfg = config::AgentConfig::load();
    if cfg.jwt.is_none() {
        return;
    }

    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());
    let os_version = std::process::Command::new("sw_vers")
        .arg("-productVersion")
        .output()
        .map(|o| format!("macOS {}", String::from_utf8_lossy(&o.stdout).trim()))
        .unwrap_or_else(|_| "macOS unknown".to_string());

    let snapshot = scanner::scan(hostname, os_version);

    match sync::post_snapshot(&snapshot, &cfg).await {
        Ok(res) => {
            let mut updated_cfg = cfg;
            updated_cfg.machine_id = Some(res.machine_id);
            updated_cfg.save();

            let issue_count = res
                .health_score
                .map(|s| if s < 100 { 1u32 } else { 0u32 })
                .unwrap_or(0);
            tray::update_tray(&app, issue_count);
        }
        Err(e) => eprintln!("Sync error: {e}"),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Show setup window only when no JWT is configured yet
            let cfg_check = config::AgentConfig::load();
            if cfg_check.jwt.is_none() {
                tauri::WebviewWindowBuilder::new(
                    app,
                    "setup",
                    tauri::WebviewUrl::App("index.html".into()),
                )
                .title("DevEnv Setup")
                .inner_size(400.0, 300.0)
                .resizable(false)
                .build()?;
            }

            // Build tray icon
            tauri::tray::TrayIconBuilder::with_id("main")
                .tooltip("DevEnv")
                .title("DevEnv")
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        let cfg = config::AgentConfig::load();
                        let url = format!("{}/me", cfg.api_url);
                        let _ = app.opener().open_url(url, None::<&str>);
                    }
                })
                .build(app)?;

            let handle = app.handle().clone();
            // Run sync immediately on startup, then every 15 minutes
            tauri::async_runtime::spawn(async move {
                run_sync(handle.clone()).await;
                let mut interval = time::interval(Duration::from_secs(15 * 60));
                loop {
                    interval.tick().await;
                    run_sync(handle.clone()).await;
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_jwt])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
