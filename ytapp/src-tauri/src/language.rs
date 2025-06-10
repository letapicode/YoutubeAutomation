use whisper_cli::Language;

/// Parse an optional language code into the `whisper_cli` `Language` enum.
///
/// Returns `None` when the language should be auto-detected.
pub fn parse_language(code: Option<String>) -> Option<Language> {
    match code.as_deref() {
        Some("ne") | Some("nepali") => Some(Language::Nepali),
        Some("hi") | Some("hindi") => Some(Language::Hindi),
        Some("en") | Some("english") => Some(Language::English),
        Some("es") | Some("spanish") => Some(Language::Spanish),
        Some("fr") | Some("french") => Some(Language::French),
        Some("zh") | Some("chinese") => Some(Language::Chinese),
        Some("ar") | Some("arabic") => Some(Language::Arabic),
        Some("pt") | Some("portuguese") => Some(Language::Portuguese),
        Some("ru") | Some("russian") => Some(Language::Russian),
        Some("ja") | Some("japanese") => Some(Language::Japanese),
        Some("de") | Some("german") => Some(Language::German),
        Some("it") | Some("italian") => Some(Language::Italian),
        Some("ko") | Some("korean") => Some(Language::Korean),
        Some("vi") | Some("vietnamese") => Some(Language::Vietnamese),
        Some("tr") | Some("turkish") => Some(Language::Turkish),
        Some("id") | Some("indonesian") => Some(Language::Indonesian),
        Some("auto") | None => None,
        _ => None,
    }
}
