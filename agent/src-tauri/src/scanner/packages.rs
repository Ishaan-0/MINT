use std::process::Command;
use crate::types::GlobalPackage;

fn run(cmd: &str, args: &[&str]) -> Option<String> {
    Command::new(cmd).args(args).output().ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
}

pub fn detect_global_packages() -> Vec<GlobalPackage> {
    let mut packages = Vec::new();

    // Homebrew formulae
    if let Some(out) = run("brew", &["list", "--formula", "--versions"]) {
        for line in out.lines() {
            let parts: Vec<&str> = line.splitn(2, ' ').collect();
            if parts.len() == 2 {
                packages.push(GlobalPackage {
                    manager: "homebrew".to_string(),
                    name: parts[0].to_string(),
                    version: parts[1].trim().to_string(),
                });
            }
        }
    }

    // npm global
    if let Some(out) = run("npm", &["list", "-g", "--depth=0", "--json"]) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&out) {
            if let Some(deps) = json["dependencies"].as_object() {
                for (name, info) in deps {
                    let version = info["version"].as_str().unwrap_or("unknown").to_string();
                    packages.push(GlobalPackage {
                        manager: "npm".to_string(),
                        name: name.clone(),
                        version,
                    });
                }
            }
        }
    }

    packages
}
