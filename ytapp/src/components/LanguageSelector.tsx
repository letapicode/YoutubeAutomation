import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languages, Language } from '../features/languages';

interface LanguageSelectorProps {
    value: Language;
    onChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const id = setTimeout(() => setFilter(search), 300);
        return () => clearTimeout(id);
    }, [search]);

    const filtered = languages.filter(l =>
        l.label.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div>
            <input
                aria-label={t('font_search')}
                placeholder={t('font_search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', marginBottom: 4 }}
            />
            <select value={value} onChange={e => onChange(e.target.value as Language)}>
                {filtered.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;
