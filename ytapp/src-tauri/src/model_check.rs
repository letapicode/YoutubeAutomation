use tauri::Config;
use whisper_cli::{Model, Size};

/// Ensure the default Whisper model is present. Downloads it if missing.
pub fn ensure_whisper_model(config: &Config) {
    let size = read_size(config).unwrap_or(Size::Base);
    tauri::async_runtime::block_on(async {
        let model = Model::new(size);
        if !model.get_path().exists() {
            model.download().await;
        }
    });
}

fn read_size(_config: &Config) -> Option<Size> {
    // In Tauri v2, app config dir resolution is provided via AppHandle.path(),
    // which is not available at this early stage. Default to Base and let the
    // app settings load adjust model selection later.
    Some(Size::Base)
}
