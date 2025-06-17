use std::{
    fs::{self, File},
    io::{Write, Read, Seek, SeekFrom},
    path::{Path, PathBuf},
    process::Command,
};
use tauri::{command, Window, Manager};
use serde::{Deserialize, Serialize};
use mime_guess;
mod schema;
use schema::{CaptionOptions, GenerateParams, Profile};
use std::collections::HashMap;
use tauri::api::path::app_config_dir;
use whisper_cli::{Model, Size, Whisper};
mod model_check;
use model_check::ensure_whisper_model;
use google_youtube3::{api::Video, YouTube};
use yup_oauth2::{InstalledFlowAuthenticator, InstalledFlowReturnMethod};
use yup_oauth2::authenticator::Authenticator;
use google_youtube3::hyper_util::{
    client::legacy::{Client, connect::HttpConnector},
    rt::TokioExecutor,
};
use google_youtube3::hyper_rustls::{HttpsConnector, HttpsConnectorBuilder};
use chrono::prelude::*;
use walkdir::WalkDir;
mod language;
mod token_store;
use token_store::EncryptedTokenStorage;
mod job_queue;
use job_queue::{Job, QueueItem, enqueue, dequeue, peek_all, load_queue, clear_queue as clear_in_memory, notifier, mark_complete, mark_failed};
mod logger;
use logger::log;
use tauri::api::dialog::{blocking::MessageDialogBuilder, MessageDialogKind};
use notify::{RecommendedWatcher, RecursiveMode, Watcher, Config, EventKind, Event, Error as NotifyError};
use once_cell::sync::Lazy;
use std::sync::{Mutex, Arc};
use std::process::Child;
use futures::future::{AbortHandle, Abortable};
use std::sync::atomic::{AtomicBool, Ordering};


#[derive(Serialize)]
struct SystemFont {
    name: String,
    style: String,
    path: String,
}

#[derive(Serialize)]
struct QueueProgress {
    index: usize,
    progress: f64,
}

static WATCHER: Lazy<Mutex<Option<RecommendedWatcher>>> = Lazy::new(|| Mutex::new(None));
static ACTIVE_FFMPEG: Lazy<Mutex<Option<Arc<Mutex<Child>>>>> = Lazy::new(|| Mutex::new(None));
static ACTIVE_UPLOAD: Lazy<Mutex<Option<AbortHandle>>> = Lazy::new(|| Mutex::new(None));
static WORKER_STARTED: Lazy<AtomicBool> = Lazy::new(|| AtomicBool::new(false));


#[derive(Deserialize, Clone, Default)]
struct UploadOptions {
    title: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
    #[serde(rename = "publishAt")]
    publish_at: Option<String>,
    thumbnail: Option<String>,
    privacy: Option<String>,
    #[serde(rename = "playlistId")]
    playlist_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct AppSettings {
    intro: Option<String>,
    outro: Option<String>,
    background: Option<String>,
    caption_font: Option<String>,
    caption_font_path: Option<String>,
    caption_style: Option<String>,
    caption_size: Option<u32>,
    caption_color: Option<String>,
    caption_bg: Option<String>,
    watermark: Option<String>,
    watermark_position: Option<String>,
    show_guide: Option<bool>,
    watch_dir: Option<String>,
    auto_upload: Option<bool>,
    model_size: Option<String>,
    max_retries: Option<u32>,
    profiles: HashMap<String, Profile>,
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            intro: None,
            outro: None,
            background: None,
            caption_font: None,
            caption_font_path: None,
            caption_style: None,
            caption_size: None,
            caption_color: None,
            caption_bg: None,
            watermark: None,
            watermark_position: None,
            show_guide: Some(true),
            watch_dir: None,
            auto_upload: Some(false),
            model_size: Some("base".into()),
            max_retries: Some(3),
            profiles: HashMap::new(),
        }
    }
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut dir = app_config_dir(&app.config()).ok_or("config dir not found")?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    dir.push("settings.json");
    Ok(dir)
}

fn ass_color(hex: &str) -> Option<String> {
    let h = hex.strip_prefix('#').unwrap_or(hex);
    if h.len() == 6 {
        if let (Ok(r), Ok(g), Ok(b)) = (
            u8::from_str_radix(&h[0..2], 16),
            u8::from_str_radix(&h[2..4], 16),
            u8::from_str_radix(&h[4..6], 16),
        ) {
            return Some(format!("&H{:02X}{:02X}{:02X}&", b, g, r));
        }
    }
    None
}

fn is_image(p: &str) -> bool {
    matches!(
        Path::new(p)
            .extension()
            .and_then(|s| s.to_str())
            .map(|s| s.to_lowercase().as_str().to_owned()),
        Some(ref ext) if ["png", "jpg", "jpeg", "bmp", "gif"].contains(&ext.as_str())
    )
}

fn audio_duration(file: &str) -> Result<f64, String> {
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            file,
        ])
        .output()
        .map_err(|e| format!("failed to run ffprobe: {}", e))?;
    if !output.status.success() {
        return Err("ffprobe failed".into());
    }
    let s = String::from_utf8_lossy(&output.stdout);
    s.trim().parse::<f64>().map_err(|e| e.to_string())
}

fn temp_file(name: &str) -> PathBuf {
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("{}_{}.mp4", name, ts))
}

/// Escape a path for use in ffmpeg filter arguments
fn escape_filter_path(path: &str) -> String {
    // REASON: ffmpeg filters treat unescaped single quotes and spaces as
    // separators, so we wrap the path in single quotes and escape any
    // existing quotes to avoid injection or parsing errors.
    let escaped = path.replace('\'', "\\'");
    format!("'{}'", escaped)
}

fn run_ffmpeg(mut cmd: Command) -> Result<(), String> {
    let child = cmd.spawn().map_err(|e| e.to_string())?;
    let child = Arc::new(Mutex::new(child));
    {
        let mut active = ACTIVE_FFMPEG.lock().unwrap();
        *active = Some(child.clone());
    }
    let status = child.lock().unwrap().wait().map_err(|e| e.to_string())?;
    {
        let mut active = ACTIVE_FFMPEG.lock().unwrap();
        *active = None;
    }
    if status.success() { Ok(()) } else { Err("ffmpeg failed".into()) }
}

fn run_with_progress(mut cmd: Command, duration: f64, window: &Window, index: Option<usize>) -> Result<(), String> {
    use std::io::{BufRead, BufReader};
    cmd.args(["-progress", "pipe:1", "-nostats"]);
    cmd.stdout(std::process::Stdio::piped());
    let mut child_process = cmd.spawn().map_err(|e| format!("failed to start ffmpeg: {}", e))?;
    let stdout = child_process.stdout.take().ok_or("failed to capture stdout")?;
    let child = Arc::new(Mutex::new(child_process));
    {
        let mut active = ACTIVE_FFMPEG.lock().unwrap();
        *active = Some(child.clone());
    }
    let reader = BufReader::new(stdout);
    for line in reader.lines() {
        if let Ok(l) = line {
            if let Some(ms) = l.strip_prefix("out_time_ms=") {
                if let Ok(val) = ms.trim().parse::<u64>() {
                    let pct = (val as f64) / (duration * 1_000_000.0) * 100.0;
                    let pct = pct.min(100.0);
                    let _ = window.emit("generate_progress", pct);
                    if let Some(i) = index {
                        let _ = window.emit("queue_progress", QueueProgress { index: i, progress: pct });
                    }
                }
            }
        }
    }
    let status = child.lock().unwrap().wait().map_err(|e| format!("ffmpeg error: {}", e))?;
    {
        let mut active = ACTIVE_FFMPEG.lock().unwrap();
        *active = None;
    }
    if status.success() { Ok(()) } else { Err(format!("ffmpeg exited with status {:?}", status.code())) }
}

struct ProgressReader<R: Read + Seek> {
    inner: R,
    window: Window,
    index: Option<usize>,
    total: u64,
    sent: u64,
    last: u64,
}

impl<R: Read + Seek> ProgressReader<R> {
    fn new(inner: R, window: Window, total: u64, index: Option<usize>) -> Self {
        Self { inner, window, index, total, sent: 0, last: 0 }
    }
}

impl<R: Read + Seek> Read for ProgressReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let n = self.inner.read(buf)?;
        if n > 0 && self.total > 0 {
            self.sent += n as u64;
            let pct = ((self.sent as f64 / self.total as f64) * 100.0).floor() as u64;
            if pct != self.last {
                let _ = self.window.emit("upload_progress", pct as f64);
                if let Some(i) = self.index {
                    let _ = self.window.emit("queue_progress", QueueProgress { index: i, progress: pct as f64 });
                }
                self.last = pct;
            }
        }
        Ok(n)
    }
}

impl<R: Read + Seek> Seek for ProgressReader<R> {
    fn seek(&mut self, pos: SeekFrom) -> std::io::Result<u64> {
        self.inner.seek(pos)
    }
}

fn parse_publish_at(s: &str) -> Option<DateTime<Utc>> {
    if let Ok(dt) = DateTime::parse_from_rfc3339(s) {
        return Some(dt.with_timezone(&Utc));
    }
    if let Ok(naive) = NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M") {
        let local = Local.from_local_datetime(&naive).single()?;
        return Some(local.with_timezone(&Utc));
    }
    None
}

fn convert_media(path: &str, duration: Option<f64>, width: u32, height: u32) -> Result<PathBuf, String> {
    let out = temp_file("segment");
    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-y");
    if is_image(path) {
        let dur = duration.unwrap_or(5.0);
        cmd.args(["-loop", "1", "-t", &dur.to_string(), "-i", path]);
    } else {
        cmd.args(["-i", path]);
    }
    cmd.args([
        "-vf",
        &format!("scale={}x{}", width, height),
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        out.to_str().unwrap(),
    ]);
    run_ffmpeg(cmd)?;
    Ok(out)
}

fn build_main_section(window: Option<&Window>, params: &GenerateParams, duration: f64, width: u32, height: u32, index: Option<usize>) -> Result<PathBuf, String> {
    let out = temp_file("main");
    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-y");


    match params.background.as_deref() {
        Some(bg) if is_image(bg) => {
            cmd.args(["-loop", "1", "-t", &duration.to_string(), "-i", bg]);
        }
        Some(bg) => {
            cmd.args(["-stream_loop", "-1", "-t", &duration.to_string(), "-i", bg]);
        }
        None => {
            cmd.args([
                "-f",
                "lavfi",
                "-i",
                &format!("color=c=black:s={}x{}:r=25", width, height),
                "-t",
                &duration.to_string(),
            ]);
        }
    }

    cmd.args(["-i", &params.file, "-shortest", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-c:a", "aac"]);
    let mut filter_chain = format!("scale={}x{}", width, height);

    if let Some(ref caption_file) = params.captions {
        let opts = params.caption_options.clone().unwrap_or_default();
        let font = opts.font.unwrap_or_else(|| "Arial".to_string());
        let size = opts.size.unwrap_or(24);
        let style = opts.style.unwrap_or_else(|| "".to_string());
        let alignment = match opts.position.unwrap_or_else(|| "bottom".to_string()).as_str() {
            "top" => "8",
            "center" => "5",
            _ => "2",
        };
        let mut style_parts = vec![format!("FontName={}", font), format!("FontSize={}", size), format!("Alignment={}", alignment)];
        if style.to_lowercase().contains("bold") {
            style_parts.push("Bold=1".into());
        }
        if style.to_lowercase().contains("italic") {
            style_parts.push("Italic=1".into());
        }
        if let Some(ref c) = opts.color.as_deref().and_then(ass_color) {
            style_parts.push(format!("PrimaryColour={}", c));
        }
        if let Some(ref b) = opts.background.as_deref().and_then(ass_color) {
            style_parts.push(format!("BackColour={}", b));
            style_parts.push("BorderStyle=3".into());
        }
        if let Some(ref path) = opts.font_path {
            let dir = Path::new(path).parent().and_then(|p| p.to_str()).unwrap_or("");
            filter_chain = format!(
                "{} ,subtitles={}:fontsdir={}:force_style='{}'",
                filter_chain,
                escape_filter_path(caption_file),
                dir,
                style_parts.join(",")
            );
        } else {
            filter_chain = format!(
                "{} ,subtitles={}:force_style='{}'",
                filter_chain,
                escape_filter_path(caption_file),
                style_parts.join(",")
            );
        }
    }

    if let Some(ref wm) = params.watermark {
        if Path::new(wm).exists() {
            let pos = match params
                .watermark_position
                .as_deref()
                .unwrap_or("top-right")
            {
                "top-left" => "10:10",
                "top-right" => "W-w-10:10",
                "bottom-left" => "10:H-h-10",
                _ => "W-w-10:H-h-10",
            };
            filter_chain = format!(
                "{},movie={},scale=iw/5:-1[wm];[in][wm]overlay={}",
                filter_chain,
                escape_filter_path(wm),
                pos
            );
        }
    }

    cmd.args(["-vf", &filter_chain]);

    cmd.arg(out.to_str().unwrap());
    if let Some(w) = window {
        run_with_progress(cmd, duration, w, index)?;
    } else {
        run_ffmpeg(cmd)?;
    }
    Ok(out)
}

#[command]
fn generate_video(window: Window, params: GenerateParams, queue_index: Option<usize>) -> Result<String, String> {
    log(&window.app_handle(), "info", "generate_video start");
    let output_path = params
        .output
        .clone()
        .unwrap_or_else(|| "output.mp4".to_string());

    if let Some(parent) = Path::new(&output_path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    let width = params.width.unwrap_or(1280);
    let height = params.height.unwrap_or(720);

    let duration = audio_duration(&params.file)?;
    let _ = window.emit("generate_progress", 0f64);
    let main = build_main_section(Some(&window), &params, duration, width, height, queue_index)?;

    let mut segments = Vec::new();
    if let Some(ref intro) = params.intro {
        segments.push(convert_media(intro, Some(5.0), width, height)?);
    }
    segments.push(main);
    if let Some(ref outro) = params.outro {
        segments.push(convert_media(outro, Some(5.0), width, height)?);
    }

    if segments.len() == 1 {
        fs::rename(&segments[0], &output_path).map_err(|e| e.to_string())?;
    } else {
        let list_path = temp_file("list");
        let mut list = File::create(&list_path).map_err(|e| e.to_string())?;
        for seg in &segments {
            writeln!(list, "file '{}'", seg.to_string_lossy()).map_err(|e| e.to_string())?;
        }
        let status = Command::new("ffmpeg")
            .args([
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                list_path.to_str().unwrap(),
                "-c",
                "copy",
                &output_path,
            ])
            .status()
            .map_err(|e| format!("failed to start ffmpeg: {}", e))?;
        if !status.success() {
            return Err(format!("ffmpeg exited with status {:?}", status.code()));
        }
    }

    let _ = window.emit("generate_progress", 100f64);
    log(&window.app_handle(), "info", "generate_video done");

    Ok(output_path)
}

async fn upload_video_impl(window: Window, file: String, opts: UploadOptions, index: Option<usize>) -> Result<String, String> {
    log(&window.app_handle(), "info", &format!("upload_video start: {}", file));
    let auth = build_authenticator().await?;

    let client = Client::builder(TokioExecutor::new())
        .build(
            HttpsConnectorBuilder::new()
                .with_native_roots()
                .map_err(|e| e.to_string())?
                .https_or_http()
                .enable_http1()
                .build(),
        );

    let hub = YouTube::new(client, auth);

    let file_name = Path::new(&file)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("upload");

    let mut video = Video::default();
    video.snippet = Some(google_youtube3::api::VideoSnippet {
        title: Some(opts.title.clone().unwrap_or_else(|| file_name.to_string())),
        description: opts.description.clone(),
        tags: opts.tags.clone(),
        ..Default::default()
    });
    let mut status = google_youtube3::api::VideoStatus::default();
    status.privacy_status = Some(
        opts.privacy
            .clone()
            .unwrap_or_else(|| if opts.publish_at.is_some() { "private".into() } else { "public".into() }),
    );
    if let Some(ref p) = opts.publish_at {
        status.publish_at = parse_publish_at(p);
    }
    video.status = Some(status);

    let f = std::fs::File::open(&file).map_err(|e| format!("Failed to open file: {}", e))?;
    let size = f.metadata().map_err(|e| e.to_string())?.len();
    let reader = ProgressReader::new(f, window.clone(), size, index);
    let mut reader = std::io::BufReader::new(reader);
    let _ = window.emit("upload_progress", 0f64);

    let (handle, reg) = AbortHandle::new_pair();
    {
        let mut active = ACTIVE_UPLOAD.lock().unwrap();
        *active = Some(handle);
    }

    let fut = async {
        let response = hub
            .videos()
            .insert(video)
            .add_part("snippet")
            .upload_resumable(&mut reader, "video/mp4".parse().unwrap())
            .await
            .map_err(|e| format!("Upload failed: {}", e))?;
        Ok::<_, String>(response)
    };

    let result = Abortable::new(fut, reg).await;
    {
        let mut active = ACTIVE_UPLOAD.lock().unwrap();
        *active = None;
    }
    match result {
            Ok(Ok(response)) => {
                let _ = window.emit("upload_progress", 100f64);
                let id = response.1.id.unwrap_or_default();
            if let Some(th) = opts.thumbnail.as_ref() {
                if Path::new(th).exists() {
                    if let Ok(mut tf) = File::open(th) {
                        let mime = mime_guess::from_path(th).first_or_octet_stream();
                        let _ = hub
                            .thumbnails()
                            .set(&id)
                            .upload(&mut tf, mime)
                            .await;
                    }
                }
            }
            if let Some(pid) = opts.playlist_id.as_ref() {
                let item = google_youtube3::api::PlaylistItem {
                    snippet: Some(google_youtube3::api::PlaylistItemSnippet {
                        playlist_id: Some(pid.clone()),
                        resource_id: Some(google_youtube3::api::ResourceId {
                            kind: Some("youtube#video".to_string()),
                            video_id: Some(id.clone()),
                            ..Default::default()
                        }),
                        ..Default::default()
                    }),
                    ..Default::default()
                };
                let _ = hub
                    .playlist_items()
                    .insert(item)
                    .add_part("snippet")
                    .doit()
                    .await;
            }
                log(&window.app_handle(), "info", &format!("upload complete: {}", id));
                Ok(format!("Uploaded video ID: {}", id))
            }
            Ok(Err(e)) => {
                log(&window.app_handle(), "error", &e);
                Err(e)
            },
            Err(_) => {
                let _ = window.emit("upload_canceled", ());
                log(&window.app_handle(), "error", "upload canceled");
                Err("upload canceled".into())
            }
        }
}

async fn build_authenticator() -> Result<Authenticator<HttpsConnector<HttpConnector>>, String> {
    let secret_path = std::env::var("YOUTUBE_CLIENT_SECRET").unwrap_or_else(|_| "client_secret.json".into());
    let secret = yup_oauth2::read_application_secret(secret_path)
        .await
        .map_err(|e| format!("Failed to read client secret: {}", e))?;

    let token_path = std::env::var("YOUTUBE_TOKEN_FILE").unwrap_or_else(|_| "youtube_tokens.enc".into());
    let key_env = std::env::var("YOUTUBE_TOKEN_KEY")
        .map_err(|_| "YOUTUBE_TOKEN_KEY not set".to_string())?;
    let key_bytes = key_env.as_bytes();
    if key_bytes.len() != 32 {
        return Err("YOUTUBE_TOKEN_KEY must be exactly 32 bytes".into());
    }
    let mut key = [0u8; 32];
    key.copy_from_slice(key_bytes);
    let store = EncryptedTokenStorage::new(token_path, key)
        .await
        .map_err(|e| format!("Token storage error: {}", e))?;

    InstalledFlowAuthenticator::builder(secret, InstalledFlowReturnMethod::HTTPRedirect)
        .with_storage(Box::new(store))
        .build()
        .await
        .map_err(|e| format!("Auth error: {}", e))
}

#[command]
async fn upload_video(window: Window, file: String, opts: Option<UploadOptions>) -> Result<String, String> {
    upload_video_impl(window, file, opts.unwrap_or_default(), None).await
}

#[command]
async fn youtube_sign_in() -> Result<(), String> {
    build_authenticator().await.map(|_| ())
}

#[command]
async fn youtube_is_signed_in() -> bool {
    let token_path = std::env::var("YOUTUBE_TOKEN_FILE").unwrap_or_else(|_| "youtube_tokens.enc".into());
    tokio::fs::metadata(token_path).await.is_ok()
}

#[command]
async fn youtube_sign_out() -> Result<(), String> {
    let token_path = std::env::var("YOUTUBE_TOKEN_FILE").unwrap_or_else(|_| "youtube_tokens.enc".into());
    match tokio::fs::remove_file(&token_path).await {
        Ok(_) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[derive(Serialize)]
struct PlaylistInfo {
    id: String,
    title: String,
}

#[command]
async fn list_playlists() -> Result<Vec<PlaylistInfo>, String> {
    let auth = build_authenticator().await?;

    let client = Client::builder(TokioExecutor::new())
        .build(
            HttpsConnectorBuilder::new()
                .with_native_roots()
                .map_err(|e| e.to_string())?
                .https_or_http()
                .enable_http1()
                .build(),
        );

    let hub = YouTube::new(client, auth);

    let resp = hub
        .playlists()
        .list(&vec!["snippet".to_string()])
        .mine(true)
        .max_results(50)
        .doit()
        .await
        .map_err(|e| e.to_string())?;

    let playlists = resp
        .1
        .items
        .unwrap_or_default()
        .into_iter()
        .map(|p| PlaylistInfo {
            id: p.id.unwrap_or_default(),
            title: p.snippet.and_then(|s| s.title).unwrap_or_default(),
        })
        .collect();

    Ok(playlists)
}

#[command]
async fn generate_upload(window: Window, params: GenerateParams, queue_index: Option<usize>) -> Result<String, String> {
    let output = generate_video(window.clone(), params.clone(), queue_index)?;
    let result = upload_video_impl(window.clone(), output.clone(), UploadOptions {
        title: params.title,
        description: params.description,
        tags: params.tags,
        publish_at: params.publish_at,
        thumbnail: params.thumbnail,
        privacy: params.privacy.clone(),
        playlist_id: params.playlist_id.clone(),
        ..Default::default()
    }, queue_index).await?;
    let _ = fs::remove_file(output);
    Ok(result)
}

#[command]
async fn upload_videos(window: Window, files: Vec<String>, opts: Option<UploadOptions>) -> Result<Vec<String>, String> {
    let mut results = Vec::new();
    let o = opts.unwrap_or_default();
    for file in files {
        results.push(upload_video_impl(window.clone(), file, o.clone(), None).await?);
    }
    Ok(results)
}

#[derive(Deserialize)]
struct BatchGenerateParams {
    files: Vec<String>,
    output_dir: Option<String>,
    captions: Option<String>,
    caption_options: Option<CaptionOptions>,
    background: Option<String>,
    intro: Option<String>,
    outro: Option<String>,
    watermark: Option<String>,
    watermark_position: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    title: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
    publish_at: Option<String>,
    thumbnail: Option<String>,
    privacy: Option<String>,
    #[serde(rename = "playlistId")]
    playlist_id: Option<String>,
}

#[derive(Deserialize, Clone, Default)]
struct WatchOptions {
    captions: Option<String>,
    caption_options: Option<CaptionOptions>,
    background: Option<String>,
    intro: Option<String>,
    outro: Option<String>,
    watermark: Option<String>,
    watermark_position: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    title: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
    publish_at: Option<String>,
    thumbnail: Option<String>,
    privacy: Option<String>,
    #[serde(rename = "playlistId")]
    playlist_id: Option<String>,
}

#[derive(Deserialize, Clone)]
struct WatchDirectoryParams {
    dir: String,
    options: Option<WatchOptions>,
    auto_upload: bool,
}

#[command]
async fn generate_batch_upload(window: Window, params: BatchGenerateParams) -> Result<Vec<String>, String> {
    let mut results = Vec::new();
    for file in &params.files {
        let out = if let Some(ref dir) = params.output_dir {
            let name = Path::new(file)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("out");
            Some(format!("{}/{}.mp4", dir, name))
        } else {
            None
        };
        let video = generate_video(window.clone(), GenerateParams {
            file: file.clone(),
            output: out.clone(),
            captions: params.captions.clone(),
            caption_options: params.caption_options.clone(),
            background: params.background.clone(),
            watermark: params.watermark.clone(),
            watermark_position: params.watermark_position.clone(),
            intro: params.intro.clone(),
            outro: params.outro.clone(),
            width: params.width,
            height: params.height,
            title: params.title.clone(),
            description: params.description.clone(),
            tags: params.tags.clone(),
            publish_at: params.publish_at.clone(),
            thumbnail: params.thumbnail.clone(),
            privacy: params.privacy.clone(),
            playlist_id: params.playlist_id.clone(),
        }, None)?;
        let res = upload_video_impl(window.clone(), video.clone(), UploadOptions {
            title: params.title.clone(),
            description: params.description.clone(),
            tags: params.tags.clone(),
            publish_at: params.publish_at.clone(),
            thumbnail: params.thumbnail.clone(),
            privacy: params.privacy.clone(),
            playlist_id: params.playlist_id.clone(),
            ..Default::default()
        }, None).await?;
        let _ = fs::remove_file(video);
        results.push(res);
    }
    Ok(results)
}

#[command]
fn watch_directory(window: Window, params: WatchDirectoryParams) -> Result<(), String> {
    let mut guard = WATCHER.lock().unwrap();
    if let Some(mut w) = guard.take() {
        let _ = w.unwatch(Path::new(&params.dir));
    }
    if params.dir.is_empty() {
        return Ok(());
    }
    let dir = params.dir.clone();
    let opts = params.options.clone().unwrap_or_default();
    let auto = params.auto_upload;
    let win = window.clone();
    start_queue_worker(win.clone());
    let app_handle = window.app_handle();
    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, NotifyError>| {
            if let Ok(event) = res {
                if matches!(event.kind, EventKind::Create(_)) {
                    for p in event.paths {
                        if p.is_file() {
                            if let Some(ext) = p.extension().and_then(|s| s.to_str()) {
                                let ext = ext.to_ascii_lowercase();
                                if ["mp3", "wav", "m4a", "flac", "aac"].contains(&ext.as_str()) {
                                    let gp = GenerateParams {
                                        file: p.to_string_lossy().to_string(),
                                        output: None,
                                        captions: opts.captions.clone(),
                                        caption_options: opts.caption_options.clone(),
                                        background: opts.background.clone(),
                                        watermark: opts.watermark.clone(),
                                        watermark_position: opts.watermark_position.clone(),
                                        intro: opts.intro.clone(),
                                        outro: opts.outro.clone(),
                                        width: opts.width,
                                        height: opts.height,
                                        title: opts.title.clone(),
                                        description: opts.description.clone(),
                                        tags: opts.tags.clone(),
                                        publish_at: opts.publish_at.clone(),
                                        thumbnail: opts.thumbnail.clone(),
                                        privacy: opts.privacy.clone(),
                                        playlist_id: opts.playlist_id.clone(),
                                    };
                                    let dest = p.with_extension("mp4").to_string_lossy().to_string();
                                    let job = if auto {
                                        Job::GenerateUpload { params: gp, dest, thumbnail: opts.thumbnail.clone() }
                                    } else {
                                        Job::Generate { params: gp, dest }
                                    };
                                    let _ = enqueue(&app_handle, job);
                                }
                            }
                        }
                    }
                }
            }
        },
        Config::default(),
    ).map_err(|e| e.to_string())?;
    watcher.watch(Path::new(&dir), RecursiveMode::NonRecursive).map_err(|e| e.to_string())?;
    *guard = Some(watcher);
    Ok(())
}

#[command]
fn load_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(&app)?;
    let data = match fs::read_to_string(&path) {
        Ok(d) => d,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(AppSettings::default()),
        Err(e) => return Err(e.to_string()),
    };
    let mut settings: AppSettings = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    if settings.show_guide.is_none() {
        settings.show_guide = Some(true);
    }
    if settings.auto_upload.is_none() {
        settings.auto_upload = Some(false);
    }
    if settings.model_size.is_none() {
        settings.model_size = Some("base".into());
    }
    if settings.max_retries.is_none() {
        settings.max_retries = Some(3);
    }
    if settings.profiles.is_empty() {
        settings.profiles = HashMap::new();
    }
    Ok(settings)
}

#[command]
fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = settings_path(&app)?;
    let data = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

#[command]
fn load_srt(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[command]
fn save_srt(path: String, data: String) -> Result<(), String> {
    fs::write(path, data).map_err(|e| e.to_string())
}

#[command]
fn cancel_generate(window: Window) -> Result<(), String> {
    if let Some(child) = ACTIVE_FFMPEG.lock().unwrap().take() {
        let _ = child.lock().unwrap().kill();
        let _ = window.emit("generate_canceled", ());
    }
    Ok(())
}

#[command]
fn cancel_upload(window: Window) -> Result<(), String> {
    if let Some(handle) = ACTIVE_UPLOAD.lock().unwrap().take() {
        handle.abort();
        let _ = window.emit("upload_canceled", ());
    }
    Ok(())
}

#[command]
fn queue_add(app: tauri::AppHandle, job: Job) -> Result<(), String> {
    load_queue(&app).ok();
    log(&app, "info", "queue_add");
    enqueue(&app, job)
}

#[command]
fn queue_list(app: tauri::AppHandle) -> Result<Vec<QueueItem>, String> {
    load_queue(&app).ok();
    Ok(peek_all())
}

#[command]
fn queue_clear(app: tauri::AppHandle) -> Result<(), String> {
    load_queue(&app).ok();
    log(&app, "info", "queue_clear");
    clear_in_memory(&app)
}

#[command]
fn queue_remove(app: tauri::AppHandle, index: usize) -> Result<(), String> {
    load_queue(&app).ok();
    log(&app, "info", "queue_remove");
    job_queue::remove_job(&app, index)
}

#[command]
fn queue_move(app: tauri::AppHandle, from: usize, to: usize) -> Result<(), String> {
    load_queue(&app).ok();
    log(&app, "info", "queue_move");
    job_queue::move_job(&app, from, to)
}

#[command]
fn queue_clear_completed(app: tauri::AppHandle) -> Result<(), String> {
    load_queue(&app).ok();
    log(&app, "info", "queue_clear_completed");
    job_queue::clear_completed(&app)
}

#[command]
async fn queue_process(window: Window, retry_failed: Option<bool>) -> Result<(), String> {
    let app = window.app_handle();
    load_queue(&app).ok();
    let settings = load_settings(app.clone()).unwrap_or_default();
    let max_retries = settings.max_retries.unwrap_or(3);
    let retry = retry_failed.unwrap_or(false);
    while let Some((idx, item)) = dequeue(&app, retry, max_retries)? {
        let res: Result<(), String> = match item.job {
            Job::Generate { mut params, dest } => {
                params.output = Some(dest);
                generate_video(window.clone(), params, Some(idx)).map(|_| ())
            }
            Job::GenerateUpload { mut params, dest, thumbnail } => {
                params.output = Some(dest);
                if params.thumbnail.is_none() { params.thumbnail = thumbnail.clone(); }
                generate_upload(window.clone(), params, Some(idx)).await.map(|_| ())
            }
        };
        match res {
            Ok(_) => { mark_complete(&app, idx)?; log(&app, "info", "job_complete"); },
            Err(e) => { log(&app, "error", &e); mark_failed(&app, idx, e)?; },
        }
    }
    Ok(())
}

/// Continuously process queued jobs in the background.
fn start_queue_worker(window: Window) {
    if WORKER_STARTED.swap(true, Ordering::SeqCst) {
        return;
    }
    tauri::async_runtime::spawn(async move {
        let app = window.app_handle();
        let notify = notifier();
        loop {
            load_queue(&app).ok();
            let settings = load_settings(app.clone()).unwrap_or_default();
            let max_retries = settings.max_retries.unwrap_or(3);
            if let Some((idx, item)) = dequeue(&app, true, max_retries).unwrap_or(None) {
                let res: Result<(), String> = match item.job {
                    Job::Generate { mut params, dest } => {
                        params.output = Some(dest);
                        generate_video(window.clone(), params, Some(idx)).map(|_| ())
                    }
                    Job::GenerateUpload { mut params, dest, thumbnail } => {
                        params.output = Some(dest);
                        if params.thumbnail.is_none() { params.thumbnail = thumbnail.clone(); }
                        generate_upload(window.clone(), params, Some(idx)).await.map(|_| ())
                    }
                };
                match res {
                    Ok(_) => { let _ = mark_complete(&app, idx); log(&app, "info", "job_complete"); },
                    Err(e) => { log(&app, "error", &e); let _ = mark_failed(&app, idx, e); },
                }
            } else {
                notify.notified().await;
            }
        }
    });
}

#[command]
fn profile_list(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let settings = load_settings(app.clone())?;
    Ok(settings.profiles.keys().cloned().collect())
}

#[command]
fn profile_get(app: tauri::AppHandle, name: String) -> Result<Profile, String> {
    let settings = load_settings(app.clone())?;
    settings.profiles.get(&name).cloned().ok_or_else(|| "profile not found".into())
}

#[command]
fn profile_save(app: tauri::AppHandle, name: String, profile: Profile) -> Result<(), String> {
    let mut settings = load_settings(app.clone())?;
    settings.profiles.insert(name, profile);
    save_settings(app, settings)
}

#[command]
fn profile_delete(app: tauri::AppHandle, name: String) -> Result<(), String> {
    let mut settings = load_settings(app.clone())?;
    settings.profiles.remove(&name);
    save_settings(app, settings)
}

#[derive(Deserialize)]
struct TranscribeParams {
    file: String,
    language: Option<String>,
    size: Option<String>,
}

#[command]
fn transcribe_audio(params: TranscribeParams) -> Result<String, String> {
    let audio_path = PathBuf::from(&params.file);
    let srt_path = audio_path.with_extension("srt");

    // run asynchronous whisper in tauri runtime
    tauri::async_runtime::block_on(async {
        let lang = language::parse_language(params.language);
        let size = match params.size.as_deref() {
            Some("tiny") => Size::Tiny,
            Some("small") => Size::Small,
            Some("medium") => Size::Medium,
            Some("large") => Size::Large,
            _ => Size::Base,
        };
        let mut whisper = Whisper::new(Model::new(size), lang).await;
        let transcript = whisper
            .transcribe(&audio_path, false, false)
            .map_err(|e| e.to_string())?;
        std::fs::write(&srt_path, transcript.as_srt()).map_err(|e| e.to_string())?;
        Ok::<_, String>(())
    })?;

    Ok(srt_path.to_string_lossy().to_string())
}

/// Scan common font directories and return available fonts.
#[command]
fn list_fonts() -> Result<Vec<SystemFont>, String> {
    list_fonts_inner()
}

fn scan_font_dirs(dirs: &[PathBuf]) -> Vec<SystemFont> {
    let mut fonts = Vec::new();
    for dir in dirs {
        if dir.exists() {
            for entry in WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
                if entry.file_type().is_file() {
                    let path = entry.path();
                    if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                        if ["ttf", "otf"].iter().any(|e| ext.eq_ignore_ascii_case(e)) {
                            fonts.push(SystemFont {
                                name: path
                                    .file_stem()
                                    .and_then(|s| s.to_str())
                                    .unwrap_or("")
                                    .to_string(),
                                style: "Regular".into(),
                                path: path.to_string_lossy().to_string(),
                            });
                        }
                    }
                }
            }
        }
    }
    fonts
}

#[cfg(target_os = "windows")]
fn list_fonts_inner() -> Result<Vec<SystemFont>, String> {
    let windir = std::env::var("WINDIR").unwrap_or_else(|_| "C:\\Windows".into());
    let mut dirs = vec![PathBuf::from(windir).join("Fonts")];
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        dirs.push(Path::new(&local).join("Microsoft/Windows/Fonts"));
        dirs.push(Path::new(&local).join("Fonts"));
    }
    Ok(scan_font_dirs(&dirs))
}

#[cfg(target_os = "macos")]
fn list_fonts_inner() -> Result<Vec<SystemFont>, String> {
    let mut dirs = vec![
        PathBuf::from("/System/Library/Fonts"),
        PathBuf::from("/Library/Fonts"),
    ];
    if let Ok(home) = std::env::var("HOME") {
        dirs.push(Path::new(&home).join("Library/Fonts"));
    }
    Ok(scan_font_dirs(&dirs))
}

#[cfg(target_os = "linux")]
fn list_fonts_inner() -> Result<Vec<SystemFont>, String> {
    if let Ok(output) = Command::new("fc-list")
        .args(["-f", "%{family}||%{style}||%{file}\n"])
        .output()
    {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut fonts = Vec::new();
            for line in stdout.lines() {
                if let Some((fam, rest)) = line.split_once("||") {
                    if let Some((style, file)) = rest.split_once("||") {
                        fonts.push(SystemFont {
                            name: fam.trim().split(',').next().unwrap_or("").to_string(),
                            style: style.trim().to_string(),
                            path: file.trim().to_string(),
                        });
                    }
                }
            }
            if !fonts.is_empty() {
                return Ok(fonts);
            }
        }
    }

    let mut dirs = vec![
        PathBuf::from("/usr/share/fonts"),
        PathBuf::from("/usr/local/share/fonts"),
    ];
    if let Ok(home) = std::env::var("HOME") {
        dirs.push(Path::new(&home).join(".fonts"));
        dirs.push(Path::new(&home).join(".local/share/fonts"));
    }
    Ok(scan_font_dirs(&dirs))
}

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
fn list_fonts_inner() -> Result<Vec<SystemFont>, String> {
    Ok(Vec::new())
}

#[command]
fn verify_dependencies(app: tauri::AppHandle) -> Result<(), String> {
    if Command::new("ffmpeg").arg("-version").output().is_err() {
        MessageDialogBuilder::new("Missing FFmpeg", "FFmpeg is required. Please install it and ensure it is in your PATH.")
            .kind(MessageDialogKind::Error)
            .show();
        return Err("ffmpeg not found".into());
    }

    if Command::new("argos-translate").arg("--version").output().is_err() {
        MessageDialogBuilder::new(
            "Missing Argos Translate",
            "Argos Translate is required for subtitle translation. Please install it and ensure it is in your PATH."
        )
        .kind(MessageDialogKind::Error)
        .show();
        return Err("argos-translate not found".into());
    }

    let size = {
        let s = load_settings(app.clone()).unwrap_or_default();
        match s.model_size.as_deref() {
            Some("tiny") => Size::Tiny,
            Some("small") => Size::Small,
            Some("medium") => Size::Medium,
            Some("large") => Size::Large,
            _ => Size::Base,
        }
    };
    let model = Model::new(size);
    if !model.get_path().exists() {
        MessageDialogBuilder::new("Downloading Whisper model", "The selected Whisper model is missing and will be downloaded now. This may take a while.")
            .kind(MessageDialogKind::Info)
            .show();
        tauri::async_runtime::block_on(async { model.download().await; });
        if !model.get_path().exists() {
            MessageDialogBuilder::new("Whisper model missing", "Failed to download the Whisper model. Please check your internet connection and restart the app.")
                .kind(MessageDialogKind::Error)
                .show();
            return Err("model missing".into());
        }
    }

    Ok(())
}

#[command]
fn install_tauri_deps() -> Result<(), String> {
    let script = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../scripts/install_tauri_deps.sh");
    if !script.exists() {
        return Err("install script not found".into());
    }
    let status = Command::new("bash")
        .arg(script)
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("script exited with status {:?}", status.code()))
    }
}

fn main() {
    let context = tauri::generate_context!();
    ensure_whisper_model(&context.config());
    tauri::Builder::default()
        .setup(|app| {
            if let Some(win) = app.get_window("main") {
                start_queue_worker(win);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![generate_video, upload_video, upload_videos, transcribe_audio, generate_upload, generate_batch_upload, watch_directory, youtube_sign_in, youtube_sign_out, youtube_is_signed_in, list_playlists, load_settings, save_settings, load_srt, save_srt, cancel_generate, cancel_upload, queue_add, queue_list, queue_remove, queue_move, queue_clear, queue_clear_completed, queue_process, profile_list, profile_get, profile_save, profile_delete, verify_dependencies, install_tauri_deps, list_fonts])
        .run(context)
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn load_and_save_srt() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("test.srt");
        save_srt(file.to_string_lossy().to_string(), "hello".into()).unwrap();
        let data = load_srt(file.to_string_lossy().to_string()).unwrap();
        assert_eq!(data, "hello");
    }

    #[test]
    #[cfg(target_os = "linux")]
    fn list_fonts_linux_mock() {
        let dir = tempfile::tempdir().unwrap();
        let font_dir = dir.path().join(".local/share/fonts");
        std::fs::create_dir_all(&font_dir).unwrap();
        let font = font_dir.join("Mock.ttf");
        std::fs::write(&font, b"dummy").unwrap();
        std::env::set_var("HOME", dir.path());
        let old_path = std::env::var_os("PATH");
        std::env::set_var("PATH", "");
        let fonts = list_fonts().unwrap();
        if let Some(old) = old_path { std::env::set_var("PATH", old); }
        assert!(fonts.iter().any(|f| f.path == font.to_string_lossy()));
    }

    #[test]
    #[cfg(target_os = "windows")]
    fn list_fonts_windows_mock() {
        let dir = tempfile::tempdir().unwrap();
        let font_dir = dir.path().join("Fonts");
        std::fs::create_dir_all(&font_dir).unwrap();
        let font = font_dir.join("Mock.ttf");
        std::fs::write(&font, b"dummy").unwrap();
        std::env::set_var("WINDIR", dir.path());
        std::env::set_var("LOCALAPPDATA", dir.path());
        let fonts = list_fonts().unwrap();
        assert!(fonts.iter().any(|f| f.path == font.to_string_lossy()));
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn list_fonts_macos_mock() {
        let dir = tempfile::tempdir().unwrap();
        let font_dir = dir.path().join("Library/Fonts");
        std::fs::create_dir_all(&font_dir).unwrap();
        let font = font_dir.join("Mock.ttf");
        std::fs::write(&font, b"dummy").unwrap();
        std::env::set_var("HOME", dir.path());
        let fonts = list_fonts().unwrap();
        assert!(fonts.iter().any(|f| f.path == font.to_string_lossy()));
    }
}
