use std::{path::{Path, PathBuf}, process::Command, io::BufReader};
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
    intro: Option<String>,
    outro: Option<String>,
}

#[command]
fn generate_video(params: GenerateParams) -> Result<String, String> {
    let output_path = params.output.unwrap_or_else(|| "output.mp4".to_string());

    let mut cmd = Command::new("ffmpeg");
    cmd.args([
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:s=1280x720:r=25",
        "-i",
        &params.file,
        "-shortest",
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
    ]);

    if let Some(caption_file) = params.captions {
        let opts = params.caption_options.unwrap_or_default();
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

    cmd.arg(&output_path);

    let status = cmd.status()
        .map_err(|e| format!("failed to start ffmpeg: {}", e))?;

    if status.success() {
        Ok(output_path)
    } else {
        Err(format!("ffmpeg exited with status {:?}", status.code()))
    }
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
