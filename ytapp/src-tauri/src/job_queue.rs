use std::{fs, path::PathBuf};
use once_cell::sync::Lazy;
use std::sync::Mutex;
use serde::{Serialize, Deserialize};
use tauri::api::path::app_config_dir;

use crate::schema::GenerateParams;

#[derive(Serialize, Deserialize, Clone)]
pub enum Job {
    Generate { params: GenerateParams, dest: String },
    GenerateUpload { params: GenerateParams, dest: String },
}

static QUEUE: Lazy<Mutex<Vec<Job>>> = Lazy::new(|| Mutex::new(Vec::new()));

fn queue_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut dir = app_config_dir(&app.config()).ok_or("config dir not found")?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    dir.push("queue.json");
    Ok(dir)
}

pub fn enqueue(app: &tauri::AppHandle, job: Job) -> Result<(), String> {
    let mut q = QUEUE.lock().unwrap();
    q.push(job);
    save_queue(app)
}

pub fn dequeue(app: &tauri::AppHandle) -> Result<Option<Job>, String> {
    let mut q = QUEUE.lock().unwrap();
    let job = if q.is_empty() { None } else { Some(q.remove(0)) };
    if job.is_some() { save_queue(app)?; }
    Ok(job)
}

pub fn peek_all() -> Vec<Job> {
    let q = QUEUE.lock().unwrap();
    q.clone()
}

pub fn save_queue(app: &tauri::AppHandle) -> Result<(), String> {
    let path = queue_path(app)?;
    let q = QUEUE.lock().unwrap();
    let data = serde_json::to_string(&*q).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

pub fn load_queue(app: &tauri::AppHandle) -> Result<(), String> {
    let path = queue_path(app)?;
    let data = match fs::read_to_string(&path) {
        Ok(d) => d,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            let mut q = QUEUE.lock().unwrap();
            q.clear();
            return Ok(());
        }
        Err(e) => return Err(e.to_string()),
    };
    let q_data: Vec<Job> = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    let mut q = QUEUE.lock().unwrap();
    *q = q_data;
    Ok(())
}
