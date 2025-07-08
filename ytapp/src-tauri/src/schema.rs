use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct CaptionOptions {
    pub font: Option<String>,
    #[serde(rename = "fontPath")]
    pub font_path: Option<String>,
    pub style: Option<String>,
    pub size: Option<u32>,
    pub position: Option<String>,
    pub color: Option<String>,
    pub background: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct Profile {
    pub captions: Option<String>,
    #[serde(rename = "captionOptions")]
    pub caption_options: Option<CaptionOptions>,
    pub background: Option<String>,
    pub intro: Option<String>,
    pub outro: Option<String>,
    pub watermark: Option<String>,
    #[serde(rename = "watermarkPosition")]
    pub watermark_position: Option<String>,
    #[serde(rename = "watermarkOpacity")]
    pub watermark_opacity: Option<f32>,
    #[serde(rename = "watermarkScale")]
    pub watermark_scale: Option<f32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fps: Option<u32>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "publishAt")]
    pub publish_at: Option<String>,
    pub thumbnail: Option<String>,
    pub privacy: Option<String>,
    #[serde(rename = "playlistId")]
    pub playlist_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct GenerateParams {
    pub file: String,
    pub output: Option<String>,
    pub captions: Option<String>,
    #[serde(rename = "captionOptions")]
    pub caption_options: Option<CaptionOptions>,
    pub background: Option<String>,
    pub intro: Option<String>,
    pub outro: Option<String>,
    pub watermark: Option<String>,
    #[serde(rename = "watermarkPosition")]
    pub watermark_position: Option<String>,
    #[serde(rename = "watermarkOpacity")]
    pub watermark_opacity: Option<f32>,
    #[serde(rename = "watermarkScale")]
    pub watermark_scale: Option<f32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fps: Option<u32>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    #[serde(rename = "publishAt")]
    pub publish_at: Option<String>,
    pub thumbnail: Option<String>,
    pub privacy: Option<String>,
    #[serde(rename = "playlistId")]
    pub playlist_id: Option<String>,
}