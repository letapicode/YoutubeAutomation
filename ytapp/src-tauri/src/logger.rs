use std::fs::{OpenOptions, create_dir_all, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::api::path::app_config_dir;
use chrono::Utc;
use serde::Serialize;

#[derive(Serialize)]
struct LogEntry<'a> {
    level: &'a str,
    message: &'a str,
    timestamp: String,
}

fn log_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
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

pub fn read_logs(app: &tauri::AppHandle, max_lines: usize) -> Result<String, String> {
    let path = match log_path(app) {
        Ok(p) => p,
        Err(e) => return Err(e),
    };
    let data = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let lines: Vec<&str> = data.lines().collect();
    let start = lines.len().saturating_sub(max_lines);
    Ok(lines[start..].join("\n"))
}

pub fn clear_logs(app: &tauri::AppHandle) -> Result<(), String> {
    let path = log_path(app)?;
    File::create(path).map(|_| ()).map_err(|e| e.to_string())
}
