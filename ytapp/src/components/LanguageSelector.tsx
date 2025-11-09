import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languages, Language } from '../features/languages';

type SingleProps = {
    multiple?: false;
    value: Language;
    onChange: (lang: Language) => void;
};

type MultiProps = {
    multiple: true;
    value: Language[];
    onChange: (langs: Language[]) => void;
};

type SharedProps = {
    includeAuto?: boolean;
    placeholder?: string;
    label?: string;
    className?: string;
};

type LanguageSelectorProps = (SingleProps | MultiProps) & SharedProps;

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    multiple,
    value,
    onChange,
    includeAuto = true,
    placeholder,
    label,
    className,
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const options = useMemo(
        () =>
            languages.filter(l => includeAuto || l.value !== 'auto').filter(l =>
                l.label.toLowerCase().includes(search.toLowerCase()),
            ),
        [includeAuto, search],
    );

    const selectedCount = multiple ? (value as Language[]).length : 0;
    const selectedLabel = useMemo(() => {
        if (multiple) {
            if (!selectedCount) {
                return placeholder || t('language_multi_placeholder');
            }
            return t('languages_selected', { count: selectedCount });
        }
        const selected = options.find(opt => opt.value === value) || languages.find(opt => opt.value === value);
        return selected?.label ?? placeholder ?? t('language_single_placeholder');
    }, [multiple, selectedCount, placeholder, value, options, t]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!open) return;
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        window.addEventListener('mousedown', handler);
        return () => window.removeEventListener('mousedown', handler);
    }, [open]);

    const toggleValue = (lang: Language) => {
        if (!multiple) {
            (onChange as (lang: Language) => void)(lang);
            setOpen(false);
            return;
        }
        const list = value as Language[];
        if (list.includes(lang)) {
            (onChange as (langs: Language[]) => void)(list.filter(l => l !== lang));
        } else {
            (onChange as (langs: Language[]) => void)([...list, lang]);
        }
    };

    return (
        <div
            className={['language-dropdown', open ? 'language-dropdown--open' : '', className]
                .filter(Boolean)
                .join(' ')}
            ref={containerRef}
        >
            {label && <span className="language-dropdown__label">{label}</span>}
            <button
                type="button"
                className="language-dropdown__toggle"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
            >
                <span>{selectedLabel}</span>
                <span className="language-dropdown__chevron" aria-hidden="true" />
            </button>
            {open && (
                <div className="language-dropdown__panel">
                    <input
                        type="search"
                        className="language-dropdown__search"
                        placeholder={t('language_filter_placeholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="language-dropdown__list" role="listbox">
                        {options.map(opt => (
                            multiple ? (
                                <label key={opt.value} className="language-dropdown__option">
                                    <input
                                        type="checkbox"
                                        checked={(value as Language[]).includes(opt.value)}
                                        onChange={() => toggleValue(opt.value)}
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            ) : (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className="language-dropdown__option"
                                    onClick={() => toggleValue(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            )
                        ))}
                        {!options.length && (
                            <div className="language-dropdown__option language-dropdown__option--empty">
                                {t('no_results')}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
