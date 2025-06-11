use serde::Deserialize;

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GenerateParams {
    pub file: String,
    pub output: Option<String>,
    pub captions: Option<String>,
    pub caption_options: Option<CaptionOptions>,
    pub background: Option<String>,
    pub intro: Option<String>,
    pub outro: Option<String>,
    pub watermark: Option<String>,
    pub watermark_position: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub publish_at: Option<String>,
}
