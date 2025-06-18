// Dropdown for selecting system fonts or a custom font file.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface SystemFont {
    name: string;
    style: string;
    path: string;
}

interface FontSelectorProps {
    value: { name: string; path?: string; style?: string } | null;
    onChange: (font: { name: string; path?: string; style?: string } | null) => void;
}

const FontSelector: React.FC<FontSelectorProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [fonts, setFonts] = useState<SystemFont[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        invoke<SystemFont[]>('list_fonts').then(setFonts).catch(() => setFonts([]));
    }, []);

    const basename = (p: string) => p.split(/[/\\]/).pop() || p;
    useEffect(() => {
        const id = setTimeout(() => setFilter(search), 300);
        return () => clearTimeout(id);
    }, [search]);

    const filteredFonts = fonts.filter(f =>
        f.name.toLowerCase().includes(filter.toLowerCase())
    );

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '__custom__') {
            const selected = await open({ filters: [{ name: 'Fonts', extensions: ['ttf', 'otf'] }] });
            if (typeof selected === 'string') {
                onChange({ name: basename(selected), path: selected });
            }
            return;
        }
        if (!val) {
            onChange(null);
            return;
        }
        const font = fonts.find(f => f.path === val);
        if (font) onChange(font); else onChange({ name: val });
    };

    const currentValue = value?.path || '';

    return (
        <div>
            <input
                aria-label={t('font_search')}
                placeholder={t('font_search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', marginBottom: 4 }}
            />
            <select value={currentValue} onChange={handleChange} aria-label="Font selector">
                <option value="">{t('default')}</option>
                {filteredFonts.map(f => (
                    <option
                        key={f.path}
                        value={f.path}
                        style={{ fontFamily: f.name }}
                    >{`${f.name} (${f.style})`}</option>
                ))}
                {value?.path && !fonts.find(f => f.path === value.path) && (
                    <option value={value.path} style={{ fontFamily: value.name }}>
                        {basename(value.path)}
                    </option>
                )}
                <option value="__custom__">{t('select_file')}</option>
            </select>
        </div>
    );
};

export default FontSelector;
