use std::process::Command;
use tauri::command;
use serde::Deserialize;

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
    // Placeholder for transcription implementation
    Ok(format!("Transcription not implemented. Received file: {}", file))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_video, upload_video, transcribe_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
