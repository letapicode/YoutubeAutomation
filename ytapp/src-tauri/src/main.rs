use std::{fs::File, io::Write, process::Command};
use tauri::command;
use serde::Deserialize;

#[derive(Deserialize)]
struct GenerateParams {
    audio: String,
    background: Option<String>,
    intro: Option<String>,
    outro: Option<String>,
    captions: Option<String>,
    output: Option<String>,
}

#[command]
fn generate_video(params: GenerateParams) -> Result<String, String> {
    let output_path = params.output.unwrap_or_else(|| "output.mp4".to_string());

    let mut ffmpeg = Command::new("ffmpeg");
    ffmpeg.arg("-y");

    match &params.background {
        Some(bg) if bg.ends_with(".mp4") || bg.ends_with(".mkv") || bg.ends_with(".mov") => {
            ffmpeg.args(["-stream_loop", "-1", "-i", bg]);
        }
        Some(bg) => {
            ffmpeg.args(["-loop", "1", "-i", bg]);
        }
        None => {
            ffmpeg.args(["-f", "lavfi", "-i", "color=c=black:s=1280x720:r=25"]);
        }
    }

    ffmpeg.args(["-i", &params.audio, "-shortest"]);

    if let Some(ref srt) = params.captions {
        ffmpeg.args(["-vf", &format!("subtitles={}", srt)]);
    }

    ffmpeg.args(["-pix_fmt", "yuv420p", "-c:v", "libx264", "-c:a", "aac", "main_temp.mp4"]);

    let status = ffmpeg.status().map_err(|e| format!("failed to start ffmpeg: {}", e))?;
    if !status.success() {
        return Err(format!("ffmpeg exited with status {:?}", status.code()));
    }

    if params.intro.is_some() || params.outro.is_some() {
        let mut list = File::create("concat_list.txt").map_err(|e| e.to_string())?;
        if let Some(intro) = params.intro {
            writeln!(list, "file '{}'", intro.replace('\\', "\\\\")).map_err(|e| e.to_string())?;
        }
        writeln!(list, "file 'main_temp.mp4'").map_err(|e| e.to_string())?;
        if let Some(outro) = params.outro {
            writeln!(list, "file '{}'", outro.replace('\\', "\\\\")).map_err(|e| e.to_string())?;
        }
        let status = Command::new("ffmpeg")
            .args(["-y", "-f", "concat", "-safe", "0", "-i", "concat_list.txt", "-c", "copy", &output_path])
            .status()
            .map_err(|e| format!("failed to start ffmpeg for concat: {}", e))?;
        if status.success() {
            Ok(output_path)
        } else {
            Err(format!("concat ffmpeg exited with status {:?}", status.code()))
        }
    } else {
        std::fs::rename("main_temp.mp4", &output_path).map_err(|e| e.to_string())?;
        Ok(output_path)
    }
}

#[command]
fn upload_video(file: String) -> Result<String, String> {
    // Placeholder for YouTube upload implementation
    Ok(format!("Upload not implemented. Received file: {}", file))
}

#[command]
fn transcribe_audio(file: String) -> Result<String, String> {
    let status = Command::new("whisper")
        .args([&file, "--model", "base", "--output_format", "srt"])
        .status()
        .map_err(|e| format!("failed to run whisper: {}", e))?;

    if status.success() {
        Ok(format!("{}.srt", file))
    } else {
        Err(format!("whisper exited with status {:?}", status.code()))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![generate_video, upload_video, transcribe_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
