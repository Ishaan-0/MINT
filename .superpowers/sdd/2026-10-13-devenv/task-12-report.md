# Task 12 Report: Tauri Agent — Sync + Tray

**Status:** DONE  
**cargo build:** PASSED (both `--lib` and binary targets)

## What Was Implemented

### Tauri Version
Used Tauri **v2** (resolved to `tauri = "2.12.3"`, `tauri-plugin-shell = "2.5.0"`, `tauri-plugin-opener = "2.7.1"`).  
The brief targeted v1 APIs — all code was written using v2 APIs.

### Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `agent/src-tauri/Cargo.toml` | Modified | Added `tauri`, `tauri-plugin-shell`, `tauri-plugin-opener`, `hostname` deps; added `[[bin]]` entry; added `tauri-build` build-dep |
| `agent/src-tauri/build.rs` | Created | `tauri_build::build()` required by Tauri |
| `agent/src-tauri/tauri.conf.json` | Created | Minimal Tauri v2 config, no bundle, no dock window |
| `agent/src-tauri/icons/icon.png` | Created | Minimal 32×32 RGBA PNG (required by `tauri::generate_context!()`) |
| `agent/src-tauri/src/config.rs` | Created | `AgentConfig` struct, load/save to `~/.config/devenv/config.json` |
| `agent/src-tauri/src/sync.rs` | Created | `post_snapshot()` — POSTs `MachineSnapshot` JSON to `/api/sync` with Bearer JWT |
| `agent/src-tauri/src/tray.rs` | Created | `update_tray()` — sets tray title to green dot or warning + issue count |
| `agent/src-tauri/src/main.rs` | Created | Tauri v2 app: tray builder, `save_jwt` command, 15-min sync loop |
| `agent/src/App.tsx` | Created | Setup UI: JWT textarea + Connect button |

### Tauri v2 API Differences from Brief
- Used `tauri::tray::TrayIconBuilder::with_id("main")` instead of `SystemTray::new()`
- Used `.on_tray_icon_event()` callback on the builder instead of `on_system_tray_event()`
- Used `tauri_plugin_opener::OpenerExt` + `app.opener().open_url()` instead of deprecated `shell().open()`
- `tauri::generate_context!()` requires an RGBA PNG icon at `icons/icon.png`

### Sync Body Shape
`MachineSnapshot` is posted directly as JSON body — no wrapping. The struct fields serialize verbatim: `runtimes`, `venvs`, `global_packages`, `path_entries`, `heavy_folders`, `scanned_at`, `hostname`, `os_version`.

### Notes
- `cargo tauri dev` was not run (requires Xcode + full macOS display setup)
- The binary imports `devenv_agent::{scanner, types}` from the lib crate in the same package — both targets share the same code
- `tauri-plugin-shell` is kept as a dependency (used internally by Tauri) but `opener` is used for URL opening
