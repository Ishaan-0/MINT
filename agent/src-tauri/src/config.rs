use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AgentConfig {
    pub jwt: Option<String>,
    pub machine_id: Option<String>,
    pub api_url: String,
}

impl AgentConfig {
    pub fn load() -> Self {
        config_path()
            .and_then(|p| fs::read_to_string(p).ok())
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_else(|| AgentConfig {
                jwt: None,
                machine_id: None,
                api_url: "https://your-app.vercel.app".to_string(),
            })
    }

    pub fn save(&self) {
        if let Some(path) = config_path() {
            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::write(path, serde_json::to_string_pretty(self).unwrap());
        }
    }
}

fn config_path() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join("devenv").join("config.json"))
}
