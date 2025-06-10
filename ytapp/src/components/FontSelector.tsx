// Dropdown for selecting system fonts or a custom font file.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/api/dialog';

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

    useEffect(() => {
        invoke<SystemFont[]>('list_fonts').then(setFonts).catch(() => setFonts([]));
    }, []);

    const basename = (p: string) => p.split(/[/\\]/).pop() || p;

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
        <select value={currentValue} onChange={handleChange}>
            <option value="">{t('default')}</option>
            {fonts.map(f => (
                <option key={f.path} value={f.path}>{`${f.name} (${f.style})`}</option>
            ))}
            {value?.path && !fonts.find(f => f.path === value.path) && (
                <option value={value.path}>{basename(value.path)}</option>
            )}
            <option value="__custom__">{t('select_file')}</option>
        </select>
    );
};

export default FontSelector;
