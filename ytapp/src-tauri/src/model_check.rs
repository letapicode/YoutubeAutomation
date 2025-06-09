use std::path::Path;

/// Ensures a Whisper model exists at the path provided by `WHISPER_MODEL_PATH`.
/// This is a lightweight stub used in tests and development.
pub fn ensure_whisper_model() {
    let path =
        std::env::var("WHISPER_MODEL_PATH").unwrap_or_else(|_| "whisper-base.en.bin".to_string());
    if !Path::new(&path).exists() {
        eprintln!("Whisper model missing at {}", path);
    }
}
