use clap::ValueEnum;
use std::str::FromStr;
use whisper_cli::Language;

/// Parse an optional language string into a [`Language`] value.
/// Unsupported or missing values default to [`Language::Auto`].
pub fn parse_language(lang: Option<String>) -> Language {
    if let Some(l) = lang {
        Language::from_str(&l, true).unwrap_or(Language::Auto)
    } else {
        Language::Auto
    }
}
