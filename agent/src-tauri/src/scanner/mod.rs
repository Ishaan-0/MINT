pub mod runtimes;
pub mod venvs;
pub mod packages;
pub mod path;
pub mod heavy_folders;

use crate::types::MachineSnapshot;
use chrono::Utc;

pub fn scan(hostname: String, os_version: String) -> MachineSnapshot {
    MachineSnapshot {
        hostname,
        os_version,
        runtimes: runtimes::detect_runtimes(),
        venvs: venvs::find_venvs(),
        global_packages: packages::detect_global_packages(),
        path_entries: path::parse_path(),
        heavy_folders: heavy_folders::find_heavy_folders(),
        scanned_at: Utc::now().to_rfc3339(),
    }
}
