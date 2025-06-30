use std::fs::{OpenOptions, create_dir_all, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::api::path::app_config_dir;
use chrono::Utc;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct LogEntry<'a> {
    level: &'a str,
    message: &'a str,
    timestamp: String,
}

fn log_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("YTAPP_TEST_DIR") {
        let mut dir = PathBuf::from(p);
        create_dir_all(&dir).map_err(|e| e.to_string())?;
        dir.push("ytapp.log");
        return Ok(dir);
    }
    let mut dir = app_config_dir(&app.config()).ok_or("config dir not found")?;
    create_dir_all(&dir).map_err(|e| e.to_string())?;
    dir.push("ytapp.log");
    Ok(dir)
}

pub fn log(app: &tauri::AppHandle, level: &str, message: &str) {
    if let Ok(path) = log_path(app) {
        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&path) {
            let entry = LogEntry {
                level,
                message,
                timestamp: Utc::now().to_rfc3339(),
            };
            if let Ok(line) = serde_json::to_string(&entry) {
                let _ = writeln!(file, "{}", line);
            }
        }
    }
}

pub fn read_logs(
    app: &tauri::AppHandle,
    max_lines: usize,
    level: Option<String>,
    search: Option<String>,
) -> Result<String, String> {
    let path = match log_path(app) {
        Ok(p) => p,
        Err(e) => return Err(e),
    };
    let data = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let mut lines = Vec::new();
    for line in data.lines() {
        if let Ok(entry) = serde_json::from_str::<LogEntry>(line) {
            if let Some(ref lvl) = level {
                if entry.level != lvl {
                    continue;
                }
            }
            if let Some(ref text) = search {
                if !entry.message.contains(text) {
                    continue;
                }
            }
            lines.push(line);
        }
    }
    let start = lines.len().saturating_sub(max_lines);
    Ok(lines[start..].join("\n"))
}

pub fn clear_logs(app: &tauri::AppHandle) -> Result<(), String> {
    let path = log_path(app)?;
    File::create(path).map(|_| ()).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::{mock_context, noop_assets};
    use tauri::Builder;

    fn setup_app() -> tauri::AppHandle {
        let dir = tempfile::tempdir().unwrap();
        std::env::set_var("YTAPP_TEST_DIR", dir.path());
        Builder::default()
            .build(mock_context(noop_assets()))
            .unwrap()
            .handle()
    }

    #[test]
    fn filter_by_level() {
        let app = setup_app();
        log(&app, "info", "hello");
        log(&app, "error", "bad");
        let logs = read_logs(&app, 10, Some("error".into()), None).unwrap();
        let lines: Vec<&str> = logs.lines().collect();
        assert_eq!(lines.len(), 1);
        let entry: LogEntry = serde_json::from_str(lines[0]).unwrap();
        assert_eq!(entry.level, "error");
        assert_eq!(entry.message, "bad");
    }

    #[test]
    fn filter_by_search() {
        let app = setup_app();
        log(&app, "info", "something good");
        log(&app, "info", "another");
        let logs = read_logs(&app, 10, None, Some("good".into())).unwrap();
        let lines: Vec<&str> = logs.lines().collect();
        assert_eq!(lines.len(), 1);
        let entry: LogEntry = serde_json::from_str(lines[0]).unwrap();
        assert!(entry.message.contains("good"));
    }

    #[test]
    fn filter_by_level_and_search() {
        let app = setup_app();
        log(&app, "info", "keep this");
        log(&app, "info", "other");
        log(&app, "error", "keep this");
        let logs = read_logs(&app, 10, Some("error".into()), Some("keep".into())).unwrap();
        let lines: Vec<&str> = logs.lines().collect();
        assert_eq!(lines.len(), 1);
        let entry: LogEntry = serde_json::from_str(lines[0]).unwrap();
        assert_eq!(entry.level, "error");
        assert!(entry.message.contains("keep"));
    }
}
