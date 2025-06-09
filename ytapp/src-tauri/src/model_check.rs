use whisper_cli::{Model, Size};

/// Ensure the default Whisper model is present. Downloads it if missing.
pub fn ensure_whisper_model() {
    tauri::async_runtime::block_on(async {
        // download() is a no-op when the model already exists
        Model::new(Size::Base).download().await;
    });
}
