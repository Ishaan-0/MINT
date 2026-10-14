use walkdir::WalkDir;
use crate::types::HeavyFolder;

const HEAVY_PATTERNS: &[&str] = &[
    "node_modules",
    "__pycache__",
    ".gradle",
    "DerivedData",
    ".tox",
    "dist",
    ".next",
];

pub fn find_heavy_folders() -> Vec<HeavyFolder> {
    let home = dirs::home_dir().unwrap_or_default();
    let mut folders = Vec::new();

    for entry in WalkDir::new(&home)
        .max_depth(6)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_dir())
    {
        let name = entry.file_name().to_string_lossy();
        if HEAVY_PATTERNS.contains(&name.as_ref()) {
            let size_mb = WalkDir::new(entry.path())
                .into_iter()
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().is_file())
                .filter_map(|e| e.metadata().ok())
                .map(|m| m.len())
                .sum::<u64>() as f64 / 1_048_576.0;

            folders.push(HeavyFolder {
                path: entry.path().to_string_lossy().to_string(),
                size_mb: (size_mb * 10.0).round() / 10.0,
            });
        }
    }

    folders.sort_by(|a, b| b.size_mb.partial_cmp(&a.size_mb).unwrap());
    folders
}
