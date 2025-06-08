use std::{
    fs::{self, File},
    io::{BufReader, Write},
    path::{Path, PathBuf},
    process::Command,
};
use tauri::command;
use serde::Deserialize;
use whisper_cli::{Language, Model, Size, Whisper};
use google_youtube3::{api::Video, YouTube};
use yup_oauth2::{InstalledFlowAuthenticator, InstalledFlowReturnMethod};
use hyper_rustls::HttpsConnectorBuilder;
use hyper_util::{client::legacy::Client, rt::TokioExecutor};

#[derive(Deserialize, Default)]
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

fn convert_media(path: &str, duration: Option<f64>) -> Result<PathBuf, String> {
    let out = temp_file("segment");
    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-y");
    if is_image(path) {
        let dur = duration.unwrap_or(5.0);
        cmd.args(["-loop", "1", "-t", &dur.to_string(), "-i", path]);
    } else {
        cmd.args(["-i", path]);
    }
    cmd.args(["-pix_fmt", "yuv420p", "-c:v", "libx264", "-c:a", "aac", out.to_str().unwrap()]);
    let status = cmd.status().map_err(|e| e.to_string())?;
    if status.success() { Ok(out) } else { Err("ffmpeg failed".into()) }
}

fn build_main_section(params: &GenerateParams, duration: f64) -> Result<PathBuf, String> {
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
                "color=c=black:s=1280x720:r=25",
                "-t",
                &duration.to_string(),
            ]);
        }
    }

    cmd.args(["-i", &params.file, "-shortest", "-pix_fmt", "yuv420p", "-c:v", "libx264", "-c:a", "aac"]);

    if let Some(ref caption_file) = params.captions {
        let opts = params.caption_options.clone().unwrap_or_default();
        let font = opts.font.unwrap_or_else(|| "Arial".to_string());
        let size = opts.size.unwrap_or(24);
        let alignment = match opts.position.unwrap_or_else(|| "bottom".to_string()).as_str() {
            "top" => "8",
            "center" => "5",
            _ => "2",
        };
        let filter = format!(
            "subtitles={}:force_style='FontName={},FontSize={},Alignment={}'",
            caption_file, font, size, alignment
        );
        cmd.args(["-vf", &filter]);
    }

    cmd.arg(out.to_str().unwrap());
    let status = cmd.status().map_err(|e| format!("failed to start ffmpeg: {}", e))?;
    if status.success() { Ok(out) } else { Err(format!("ffmpeg exited with status {:?}", status.code())) }
}

#[command]
fn generate_video(params: GenerateParams) -> Result<String, String> {
    let output_path = params.output.unwrap_or_else(|| "output.mp4".to_string());

    let duration = audio_duration(&params.file)?;
    let main = build_main_section(&params, duration)?;

    let mut segments = Vec::new();
    if let Some(ref intro) = params.intro {
        segments.push(convert_media(intro, Some(5.0))?);
    }
    segments.push(main);
    if let Some(ref outro) = params.outro {
        segments.push(convert_media(outro, Some(5.0))?);
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

    Ok(output_path)
}

#[command]
async fn upload_video(file: String) -> Result<String, String> {
    let secret_path = std::env::var("YOUTUBE_CLIENT_SECRET").unwrap_or_else(|_| "client_secret.json".into());
    let secret = yup_oauth2::read_application_secret(secret_path)
        .await
        .map_err(|e| format!("Failed to read client secret: {}", e))?;

    let auth = InstalledFlowAuthenticator::builder(secret, InstalledFlowReturnMethod::HTTPRedirect)
        .persist_tokens_to_disk("youtube_tokens.json")
        .build()
        .await
        .map_err(|e| format!("Auth error: {}", e))?;

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
    let size = f.metadata().map_err(|e| e.to_string())?.len();
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

#[command]
fn transcribe_audio(file: String) -> Result<String, String> {
    let audio_path = PathBuf::from(&file);
    let srt_path = audio_path.with_extension("srt");

    // run asynchronous whisper in tauri runtime
    tauri::async_runtime::block_on(async {
        let mut whisper = Whisper::new(Model::new(Size::Base), Some(Language::Auto)).await;
        let transcript = whisper
            .transcribe(&audio_path, false, false)
            .map_err(|e| e.to_string())?;
        std::fs::write(&srt_path, transcript.as_srt()).map_err(|e| e.to_string())?;
        Ok::<_, String>(())
    })?;

    Ok(srt_path.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_video, upload_video, transcribe_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
