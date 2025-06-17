use std::{fs, path::PathBuf};
use once_cell::sync::Lazy;
use std::sync::{Mutex, Arc};
use tokio::sync::Notify;
use serde::{Serialize, Deserialize};
use tauri::api::path::app_config_dir;
use tauri::Manager;

use crate::schema::GenerateParams;
use crate::logger;

#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub enum JobStatus {
    Pending,
    Running,
    Failed,
    Completed,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct QueueItem {
    pub job: Job,
    pub status: JobStatus,
    pub retries: u32,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub enum Job {
    Generate { params: GenerateParams, dest: String },
    GenerateUpload { params: GenerateParams, dest: String, thumbnail: Option<String> },
}

static QUEUE: Lazy<Mutex<Vec<QueueItem>>> = Lazy::new(|| Mutex::new(Vec::new()));
static NOTIFY: Lazy<Arc<Notify>> = Lazy::new(|| Arc::new(Notify::new()));

pub fn notifier() -> Arc<Notify> {
    NOTIFY.clone()
}

fn emit_changed(app: &tauri::AppHandle) {
    let _ = app.emit_all("queue_changed", ());
    logger::log(app, "info", "queue_changed");
}

fn queue_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("YTAPP_TEST_DIR") {
        let mut dir = PathBuf::from(p);
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        dir.push("queue.json");
        return Ok(dir);
    }
    let mut dir = app_config_dir(&app.config()).ok_or("config dir not found")?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    dir.push("queue.json");
    Ok(dir)
}

pub fn enqueue(app: &tauri::AppHandle, job: Job) -> Result<(), String> {
    let mut q = QUEUE.lock().unwrap();
    q.push(QueueItem { job, status: JobStatus::Pending, retries: 0, error: None });
    NOTIFY.notify_one();
    save_queue(app)?;
    emit_changed(app);
    Ok(())
}

pub fn dequeue(app: &tauri::AppHandle, retry_failed: bool, max_retries: u32) -> Result<Option<(usize, QueueItem)>, String> {
    let mut q = QUEUE.lock().unwrap();
    for (i, item) in q.iter_mut().enumerate() {
        if item.status == JobStatus::Pending ||
           (retry_failed && item.status == JobStatus::Failed && item.retries < max_retries) {
            item.status = JobStatus::Running;
            save_queue(app)?;
            return Ok(Some((i, item.clone())));
        }
    }
    Ok(None)
}

pub fn mark_complete(app: &tauri::AppHandle, index: usize) -> Result<(), String> {
    let mut q = QUEUE.lock().unwrap();
    if index < q.len() {
        q.remove(index);
    }
    save_queue(app)?;
    emit_changed(app);
    Ok(())
}

pub fn mark_failed(app: &tauri::AppHandle, index: usize, error: String) -> Result<(), String> {
    let mut q = QUEUE.lock().unwrap();
    if let Some(item) = q.get_mut(index) {
        item.status = JobStatus::Failed;
        item.retries += 1;
        item.error = Some(error);
    }
    save_queue(app)?;
    emit_changed(app);
    Ok(())
}

/// Remove a job from the queue by index.
pub fn remove_job(app: &tauri::AppHandle, index: usize) -> Result<(), String> {
    let mut q = QUEUE.lock().unwrap();
    if index < q.len() {
        q.remove(index);
    }
    save_queue(app)?;
    emit_changed(app);
    Ok(())
}

/// Move a job from one position to another.
pub fn move_job(app: &tauri::AppHandle, from: usize, to: usize) -> Result<(), String> {
    let mut q = QUEUE.lock().unwrap();
    let len = q.len();
    if from < len && to < len && from != to {
        let item = q.remove(from);
        q.insert(to, item);
        save_queue(app)?;
        emit_changed(app);
    }
    Ok(())
}

pub fn peek_all() -> Vec<QueueItem> {
    let q = QUEUE.lock().unwrap();
    q.clone()
}

pub fn save_queue(app: &tauri::AppHandle) -> Result<(), String> {
    let path = queue_path(app)?;
    let q = QUEUE.lock().unwrap();
    let data = serde_json::to_string(&*q).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())?;
    emit_changed(app);
    Ok(())
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
    let q_data: Vec<QueueItem> = match serde_json::from_str(&data) {
        Ok(v) => v,
        Err(_) => {
            let legacy: Vec<Job> = serde_json::from_str(&data).map_err(|e| e.to_string())?;
            legacy.into_iter().map(|job| QueueItem { job, status: JobStatus::Pending, retries: 0, error: None }).collect()
        }
    };
    let mut q = QUEUE.lock().unwrap();
    *q = q_data;
    Ok(())
}

/// Remove all queued jobs and persist the empty queue.
pub fn clear_queue(app: &tauri::AppHandle) -> Result<(), String> {
    let mut q = QUEUE.lock().unwrap();
    q.clear();
    save_queue(app)?;
    emit_changed(app);
    Ok(())
}

/// Remove finished jobs from the queue.
pub fn clear_completed(app: &tauri::AppHandle) -> Result<(), String> {
    let mut q = QUEUE.lock().unwrap();
    q.retain(|item| item.status == JobStatus::Pending || item.status == JobStatus::Running);
    save_queue(app)?;
    emit_changed(app);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tauri::test::mock_app;

    #[test]
    fn persist_and_retry() {
        let dir = tempfile::tempdir().unwrap();
        std::env::set_var("YTAPP_TEST_DIR", dir.path());
        let app = mock_app();
        let params = GenerateParams { file: "a.mp3".into(), output: None, captions: None, caption_options: None, background: None, intro: None, outro: None, watermark: None, watermark_position: None, width: None, height: None, title: None, description: None, tags: None, publish_at: None, thumbnail: None };
        enqueue(&app.handle(), Job::Generate { params: params.clone(), dest: "a.mp4".into() }).unwrap();
        load_queue(&app.handle()).unwrap();
        assert_eq!(peek_all().len(), 1);
        mark_failed(&app.handle(), 0, "err".into()).unwrap();
        load_queue(&app.handle()).unwrap();
        let item = peek_all()[0].clone();
        assert_eq!(item.retries, 1);
        assert_eq!(item.status, JobStatus::Failed);
    }
}
