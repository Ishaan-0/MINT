use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Runtime {
    pub name: String,
    pub version: String,
    pub manager: String,
    pub path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Venv {
    pub path: String,
    pub python_version: String,
    pub size_mb: f64,
    pub last_used_at: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GlobalPackage {
    pub manager: String,
    pub name: String,
    pub version: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PathEntry {
    pub path: String,
    pub exists: bool,
    pub duplicate: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HeavyFolder {
    pub path: String,
    pub size_mb: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MachineSnapshot {
    pub hostname: String,
    pub os_version: String,
    pub runtimes: Vec<Runtime>,
    pub venvs: Vec<Venv>,
    pub global_packages: Vec<GlobalPackage>,
    pub path_entries: Vec<PathEntry>,
    pub heavy_folders: Vec<HeavyFolder>,
    pub scanned_at: String,
}
