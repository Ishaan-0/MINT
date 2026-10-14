use std::path::{Path, PathBuf};
use std::fs;
use walkdir::WalkDir;
use crate::types::Venv;

fn read_pyvenv_cfg(venv_path: &Path) -> Option<String> {
    let cfg = venv_path.join("pyvenv.cfg");
    let contents = fs::read_to_string(cfg).ok()?;
    for line in contents.lines() {
        if line.starts_with("version") {
            return line.split('=').nth(1).map(|s| s.trim().to_string());
        }
    }
    None
}

fn dir_size_mb(path: &Path) -> f64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum::<u64>() as f64 / 1_048_576.0
}

fn is_venv(path: &Path) -> bool {
    path.join("pyvenv.cfg").exists() && path.join("bin").join("python").exists()
}

pub fn find_venvs() -> Vec<Venv> {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/"));
    let mut venvs = Vec::new();

    // Search home dir up to depth 5 for venv dirs
    for entry in WalkDir::new(&home)
        .max_depth(5)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_dir())
    {
        let path = entry.path();
        if is_venv(path) {
            let python_version = read_pyvenv_cfg(path).unwrap_or_else(|| "unknown".to_string());
            let size_mb = dir_size_mb(path);
            venvs.push(Venv {
                path: path.to_string_lossy().to_string(),
                python_version,
                size_mb: (size_mb * 10.0).round() / 10.0,
                last_used_at: None,
            });
        }
    }

    venvs
}
