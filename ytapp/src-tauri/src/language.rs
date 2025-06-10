use whisper_cli::Language;

pub fn parse_language(code: Option<String>) -> Language {
    match code.as_deref() {
        Some("ne") | Some("nepali") => Language::Nepali,
        Some("hi") | Some("hindi") => Language::Hindi,
        Some("en") | Some("english") => Language::English,
        Some("es") | Some("spanish") => Language::Spanish,
        Some("fr") | Some("french") => Language::French,
        _ => Language::Auto,
    }
}
