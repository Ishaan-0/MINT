use tauri::AppHandle;

pub fn update_tray(app: &AppHandle, issue_count: u32) {
    if let Some(tray) = app.tray_by_id("main") {
        let label = if issue_count == 0 {
            "DevEnv \u{25cf}".to_string()
        } else {
            format!("DevEnv \u{26a0} {issue_count}")
        };
        let tooltip = if issue_count == 0 {
            "DevEnv \u{2014} all good".to_string()
        } else {
            format!(
                "DevEnv \u{2014} {issue_count} issue{}",
                if issue_count == 1 { "" } else { "s" }
            )
        };
        let _ = tray.set_title(Some(&label));
        let _ = tray.set_tooltip(Some(&tooltip));
    }
}
