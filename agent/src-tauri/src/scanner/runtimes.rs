use std::process::Command;
use which::which;
use crate::types::Runtime;

pub fn parse_version_output(output: &str) -> Option<String> {
    let trimmed = output.trim();
    if trimmed.is_empty() { return None; }
    // Strip leading 'v' or 'Python ' prefix
    let cleaned = trimmed
        .trim_start_matches("Python ")
        .trim_start_matches('v');
    // Extract first semver-like token
    cleaned.split_whitespace().next().map(|s| s.to_string())
}

fn run_version_cmd(cmd: &str, args: &[&str]) -> Option<String> {
    Command::new(cmd)
        .args(args)
        .output()
        .ok()
        .and_then(|o| {
            let out = String::from_utf8_lossy(&o.stdout).to_string();
            let err = String::from_utf8_lossy(&o.stderr).to_string();
            parse_version_output(if out.trim().is_empty() { &err } else { &out })
        })
}

fn detect_python_manager() -> &'static str {
    if which("pyenv").is_ok() { return "pyenv"; }
    if which("conda").is_ok() { return "conda"; }
    "system"
}

fn detect_node_manager() -> &'static str {
    // nvm sets NVM_DIR env var
    if std::env::var("NVM_DIR").is_ok() { return "nvm"; }
    if which("volta").is_ok() { return "volta"; }
    "system"
}

pub fn detect_runtimes() -> Vec<Runtime> {
    let mut runtimes = Vec::new();

    let tools: Vec<(&str, Vec<&str>, fn() -> &'static str)> = vec![
        ("python3", vec!["--version"], || detect_python_manager()),
        ("node", vec!["--version"], || detect_node_manager()),
        ("go", vec!["version"], || "system"),
        ("rustc", vec!["--version"], || "rustup"),
        ("ruby", vec!["--version"], || "system"),
    ];

    for (cmd, args, manager_fn) in tools {
        if let (Ok(path), Some(version)) = (
            which(cmd),
            run_version_cmd(cmd, &args),
        ) {
            let name = match cmd {
                "python3" => "python",
                "rustc" => "rust",
                other => other,
            };
            runtimes.push(Runtime {
                name: name.to_string(),
                version,
                manager: manager_fn().to_string(),
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    runtimes
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_python_version_extracts_semver() {
        let output = "Python 3.11.4";
        assert_eq!(parse_version_output(output), Some("3.11.4".to_string()));
    }

    #[test]
    fn parse_node_version_strips_v_prefix() {
        let output = "v20.5.0";
        assert_eq!(parse_version_output(output), Some("20.5.0".to_string()));
    }

    #[test]
    fn parse_version_returns_none_for_empty() {
        assert_eq!(parse_version_output(""), None);
    }
}
