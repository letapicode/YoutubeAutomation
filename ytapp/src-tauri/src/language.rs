use whisper_cli::Language;
use std::str::FromStr;

/// Parse an optional language code into the `whisper_cli` `Language` enum.
///
/// Returns `None` when the language should be auto-detected.
pub fn parse_language(code: Option<String>) -> Option<Language> {
    let c = match code {
        Some(c) => c,
        None => return None,
    };
    if c == "auto" {
        return None;
    }
    Language::from_str(&c, false).ok()
}
