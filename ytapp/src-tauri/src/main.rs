use std::{path::PathBuf, process::Command};
use tauri::command;
use serde::Deserialize;
use whisper_cli::{Language, Model, Size, Whisper};

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
fn upload_video(file: String) -> Result<String, String> {
    // Placeholder for YouTube upload implementation
    Ok(format!("Upload not implemented. Received file: {}", file))
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
