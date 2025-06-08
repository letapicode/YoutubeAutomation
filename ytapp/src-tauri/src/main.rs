use std::process::Command;
use tauri::command;

#[command]
fn generate_video(file: String, output: Option<String>) -> Result<String, String> {
    let output_path = output.unwrap_or_else(|| "output.mp4".to_string());

    let status = Command::new("ffmpeg")
        .args([
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=black:s=1280x720:r=25",
            "-i",
            &file,
            "-shortest",
            "-pix_fmt",
            "yuv420p",
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            &output_path,
        ])
        .status()
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
