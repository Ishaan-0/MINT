use std::path::Path;
use std::collections::HashSet;
use crate::types::PathEntry;

pub fn parse_path() -> Vec<PathEntry> {
    let path_var = std::env::var("PATH").unwrap_or_default();
    let mut seen = HashSet::new();
    let mut entries = Vec::new();

    for p in path_var.split(':') {
        if p.is_empty() { continue; }
        let duplicate = !seen.insert(p.to_string());
        entries.push(PathEntry {
            path: p.to_string(),
            exists: Path::new(p).exists(),
            duplicate,
        });
    }

    entries
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn flags_duplicate_path_entries() {
        let entries = vec!["/usr/bin", "/usr/local/bin", "/usr/bin"];
        let mut seen = std::collections::HashSet::new();
        let results: Vec<bool> = entries.iter().map(|p| !seen.insert(*p)).collect();
        assert_eq!(results, vec![false, false, true]);
    }
}
