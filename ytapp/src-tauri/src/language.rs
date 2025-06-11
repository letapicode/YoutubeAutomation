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
        Some("nl") | Some("dutch") => Some(Language::Dutch),
        Some("th") | Some("thai") => Some(Language::Thai),
        Some("pl") | Some("polish") => Some(Language::Polish),
        Some("sv") | Some("swedish") => Some(Language::Swedish),
        Some("fi") | Some("finnish") => Some(Language::Finnish),
        Some("he") | Some("hebrew") => Some(Language::Hebrew),
        Some("uk") | Some("ukrainian") => Some(Language::Ukrainian),
        Some("el") | Some("greek") => Some(Language::Greek),
        Some("ms") | Some("malay") => Some(Language::Malay),
        Some("cs") | Some("czech") => Some(Language::Czech),
        Some("ro") | Some("romanian") => Some(Language::Romanian),
        Some("da") | Some("danish") => Some(Language::Danish),
        Some("hu") | Some("hungarian") => Some(Language::Hungarian),
        Some("no") | Some("norwegian") => Some(Language::Norwegian),
        Some("ur") | Some("urdu") => Some(Language::Urdu),
        Some("hr") | Some("croatian") => Some(Language::Croatian),
        Some("bg") | Some("bulgarian") => Some(Language::Bulgarian),
        Some("lt") | Some("lithuanian") => Some(Language::Lithuanian),
        Some("lv") | Some("latvian") => Some(Language::Latvian),
        Some("sk") | Some("slovak") => Some(Language::Slovak),
        Some("ca") | Some("catalan") => Some(Language::Catalan),
        Some("sr") | Some("serbian") => Some(Language::Serbian),
        Some("mk") | Some("macedonian") => Some(Language::Macedonian),
        Some("sl") | Some("slovenian") => Some(Language::Slovenian),
        Some("gl") | Some("galician") => Some(Language::Galician),
        Some("az") | Some("azerbaijani") => Some(Language::Azerbaijani),
        Some("et") | Some("estonian") => Some(Language::Estonian),
        Some("nn") | Some("nynorsk") => Some(Language::Nynorsk),
        Some("cy") | Some("welsh") => Some(Language::Welsh),
        Some("pa") | Some("punjabi") => Some(Language::Punjabi),
        Some("af") | Some("afrikaans") => Some(Language::Afrikaans),
        Some("fa") | Some("persian") => Some(Language::Persian),
        Some("eu") | Some("basque") => Some(Language::Basque),
        Some("bn") | Some("bengali") => Some(Language::Bengali),
        Some("mr") | Some("marathi") => Some(Language::Marathi),
        Some("be") | Some("belarusian") => Some(Language::Belarusian),
        Some("kk") | Some("kazakh") => Some(Language::Kazakh),
        Some("hy") | Some("armenian") => Some(Language::Armenian),
        Some("sw") | Some("swahili") => Some(Language::Swahili),
        Some("ta") | Some("tamil") => Some(Language::Tamil),
        Some("sq") | Some("albanian") => Some(Language::Albanian),
        Some("tl") | Some("tagalog") => Some(Language::Tagalog),
        Some("bs") | Some("bosnian") => Some(Language::Bosnian),
        Some("is") | Some("icelandic") => Some(Language::Icelandic),
        Some("kn") | Some("kannada") => Some(Language::Kannada),
        Some("te") | Some("telugu") => Some(Language::Telugu),
        Some("mi") | Some("maori") => Some(Language::Maori),
        Some("gu") | Some("gujarati") => Some(Language::Gujarati),
        Some("auto") | None => None,
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_known_codes() {
        assert!(matches!(parse_language(Some("en".into())), Some(Language::English)));
        assert!(matches!(parse_language(Some("ne".into())), Some(Language::Nepali)));
    }

    #[test]
    fn handles_auto_and_unknown() {
        assert!(parse_language(Some("auto".into())).is_none());
        assert!(parse_language(Some("xx".into())).is_none());
        assert!(parse_language(None).is_none());
    }
}
