use std::{
    fs::{self, File},
    io::{BufReader, Write},
    path::{Path, PathBuf},
    process::Command,
};
use tauri::{command, Window};
use serde::{Deserialize, Serialize};
use tauri::api::path::app_config_dir;
use whisper_cli::{Language, Model, Size, Whisper};
mod model_check;
use model_check::ensure_whisper_model;
use google_youtube3::{api::Video, YouTube};
use yup_oauth2::{InstalledFlowAuthenticator, InstalledFlowReturnMethod};
use yup_oauth2::authenticator::Authenticator;
use hyper_rustls::HttpsConnectorBuilder;
use hyper_util::{client::legacy::Client, rt::TokioExecutor};
mod language;
mod token_store;
use token_store::EncryptedTokenStorage;
use tauri::api::dialog::{blocking::MessageDialogBuilder, MessageDialogKind};

#[derive(Deserialize, Default, Clone)]
struct CaptionOptions {
    font: Option<String>,
    size: Option<u32>,
    position: Option<String>,
}

#[derive(Deserialize)]
struct GenerateParams {
    file: String,
    output: Option<String>,
    captions: Option<String>,
    caption_options: Option<CaptionOptions>,
    background: Option<String>,
    intro: Option<String>,
    outro: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
}

#[derive(Serialize, Deserialize, Default, Clone)]
struct AppSettings {
    intro: Option<String>,
    outro: Option<String>,
    background: Option<String>,
    caption_font: Option<String>,
    caption_size: Option<u32>,
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut dir = app_config_dir(&app.config()).ok_or("config dir not found")?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    dir.push("settings.json");
    Ok(dir)
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

fn run_with_progress(mut cmd: Command, duration: f64, window: &Window) -> Result<(), String> {
    use std::io::{BufRead, BufReader};
    cmd.args(["-progress", "pipe:1", "-nostats"]);
    cmd.stdout(std::process::Stdio::piped());
    let mut child = cmd.spawn().map_err(|e| format!("failed to start ffmpeg: {}", e))?;
    let stdout = child.stdout.take().ok_or("failed to capture stdout")?;
    let reader = BufReader::new(stdout);
    for line in reader.lines() {
        if let Ok(l) = line {
            if let Some(ms) = l.strip_prefix("out_time_ms=") {
                if let Ok(val) = ms.trim().parse::<u64>() {
                    let pct = (val as f64) / (duration * 1_000_000.0) * 100.0;
                    let _ = window.emit("generate_progress", pct.min(100.0));
                }
            }
        }
    }
    let status = child.wait().map_err(|e| format!("ffmpeg error: {}", e))?;
    if status.success() { Ok(()) } else { Err(format!("ffmpeg exited with status {:?}", status.code())) }
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
    let status = cmd.status().map_err(|e| e.to_string())?;
    if status.success() { Ok(out) } else { Err("ffmpeg failed".into()) }
}

fn build_main_section(window: Option<&Window>, params: &GenerateParams, duration: f64, width: u32, height: u32) -> Result<PathBuf, String> {
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
        let alignment = match opts.position.unwrap_or_else(|| "bottom".to_string()).as_str() {
            "top" => "8",
            "center" => "5",
            _ => "2",
        };
        filter_chain = format!(
            "{} ,subtitles={}:force_style='FontName={},FontSize={},Alignment={}'",
            filter_chain, caption_file, font, size, alignment
        );
    }

    cmd.args(["-vf", &filter_chain]);

    cmd.arg(out.to_str().unwrap());
    if let Some(w) = window {
        run_with_progress(cmd, duration, w)?;
    } else {
        let status = cmd.status().map_err(|e| format!("failed to start ffmpeg: {}", e))?;
        if !status.success() {
            return Err(format!("ffmpeg exited with status {:?}", status.code()));
        }
    }
    Ok(out)
}

#[command]
fn generate_video(window: Window, params: GenerateParams) -> Result<String, String> {
    let output_path = params
        .output
        .clone()
        .unwrap_or_else(|| "output.mp4".to_string());

    let width = params.width.unwrap_or(1280);
    let height = params.height.unwrap_or(720);

    let duration = audio_duration(&params.file)?;
    let _ = window.emit("generate_progress", 0f64);
    let main = build_main_section(Some(&window), &params, duration, width, height)?;

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

    Ok(output_path)
}

async fn upload_video_impl(file: String) -> Result<String, String> {
    let auth = build_authenticator().await?;

    let client = Client::builder(TokioExecutor::new())
        .build(
            HttpsConnectorBuilder::new()
                .with_native_roots()
                .https_or_http()
                .enable_http1()
                .build(),
        );

    let mut hub = YouTube::new(client, auth);

    let file_name = Path::new(&file)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("upload");

    let video = Video {
        snippet: Some(google_youtube3::api::VideoSnippet {
            title: Some(file_name.to_string()),
            ..Default::default()
        }),
        ..Default::default()
    };

    let f = std::fs::File::open(&file).map_err(|e| format!("Failed to open file: {}", e))?;
    let mut reader = std::io::BufReader::new(f);

    let response = hub
        .videos()
        .insert(video)
        .add_part("snippet")
        .upload_resumable(&mut reader, "video/mp4".parse().unwrap())
        .await
        .map_err(|e| format!("Upload failed: {}", e))?;

    let id = response.1.id.unwrap_or_default();
    Ok(format!("Uploaded video ID: {}", id))
}

async fn build_authenticator() -> Result<Authenticator<HttpsConnector<HttpConnector>>, String> {
    let secret_path = std::env::var("YOUTUBE_CLIENT_SECRET").unwrap_or_else(|_| "client_secret.json".into());
    let secret = yup_oauth2::read_application_secret(secret_path)
        .await
        .map_err(|e| format!("Failed to read client secret: {}", e))?;

    let token_path = std::env::var("YOUTUBE_TOKEN_FILE").unwrap_or_else(|_| "youtube_tokens.enc".into());
    let key_env = std::env::var("YOUTUBE_TOKEN_KEY").unwrap_or_else(|_| "0123456789abcdef0123456789abcdef".into());
    let mut key = [0u8; 32];
    for (i, b) in key_env.as_bytes().iter().take(32).enumerate() {
        key[i] = *b;
    }
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
async fn upload_video(file: String) -> Result<String, String> {
    upload_video_impl(file).await
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
async fn generate_upload(window: Window, params: GenerateParams) -> Result<String, String> {
    let output = generate_video(window.clone(), params)?;
    let result = upload_video_impl(output.clone()).await?;
    let _ = fs::remove_file(output);
    Ok(result)
}

#[command]
async fn upload_videos(files: Vec<String>) -> Result<Vec<String>, String> {
    let mut results = Vec::new();
    for file in files {
        results.push(upload_video_impl(file).await?);
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
    width: Option<u32>,
    height: Option<u32>,
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
            intro: params.intro.clone(),
            outro: params.outro.clone(),
            width: params.width,
            height: params.height,
        })?;
        let res = upload_video_impl(video.clone()).await?;
        let _ = fs::remove_file(video);
        results.push(res);
    }
    Ok(results)
}

#[command]
fn load_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(&app)?;
    let data = match fs::read_to_string(&path) {
        Ok(d) => d,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(AppSettings::default()),
        Err(e) => return Err(e.to_string()),
    };
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[command]
fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = settings_path(&app)?;
    let data = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
struct TranscribeParams {
    file: String,
    language: Option<String>,
}

#[command]
fn transcribe_audio(params: TranscribeParams) -> Result<String, String> {
    let audio_path = PathBuf::from(&params.file);
    let srt_path = audio_path.with_extension("srt");

    // run asynchronous whisper in tauri runtime
    tauri::async_runtime::block_on(async {
        let lang = language::parse_language(params.language);
        let mut whisper = Whisper::new(Model::new(Size::Base), lang).await;
        let transcript = whisper
            .transcribe(&audio_path, false, false)
            .map_err(|e| e.to_string())?;
        std::fs::write(&srt_path, transcript.as_srt()).map_err(|e| e.to_string())?;
        Ok::<_, String>(())
    })?;

    Ok(srt_path.to_string_lossy().to_string())
}

#[command]
fn verify_dependencies(app: tauri::AppHandle) -> Result<(), String> {
    if Command::new("ffmpeg").arg("-version").output().is_err() {
        MessageDialogBuilder::new("Missing FFmpeg", "FFmpeg is required. Please install it and ensure it is in your PATH.")
            .kind(MessageDialogKind::Error)
            .show();
        return Err("ffmpeg not found".into());
    }

    let model = Model::new(Size::Base);
    if !model.get_path().exists() {
        MessageDialogBuilder::new("Downloading Whisper model", "The base Whisper model is missing and will be downloaded now. This may take a while.")
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
    ensure_whisper_model();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_video, upload_video, upload_videos, transcribe_audio, generate_upload, generate_batch_upload, youtube_sign_in, youtube_is_signed_in, load_settings, save_settings, verify_dependencies, install_tauri_deps])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
