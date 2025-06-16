use std::fs;
use serde::Deserialize;
use serde_json;
use tauri::api::path::app_config_dir;
use tauri::Config;
use whisper_cli::{Model, Size};

/// Ensure the default Whisper model is present. Downloads it if missing.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PartialSettings {
    model_size: Option<String>,
}

pub fn ensure_whisper_model(config: &Config) {
    let size = read_size(config).unwrap_or(Size::Base);
    tauri::async_runtime::block_on(async {
        let model = Model::new(size);
        if !model.get_path().exists() {
            model.download().await;
        }
    });
}

fn read_size(config: &Config) -> Option<Size> {
    let mut path = app_config_dir(config)?;
    path.push("settings.json");
    let data = fs::read_to_string(path).ok()?;
    let s: PartialSettings = serde_json::from_str(&data).ok()?;
    match s.model_size.as_deref()? {
        "tiny" => Some(Size::Tiny),
        "small" => Some(Size::Small),
        "medium" => Some(Size::Medium),
        "large" => Some(Size::Large),
        _ => Some(Size::Base),
    }
}
