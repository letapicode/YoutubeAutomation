import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FilePicker from './FilePicker';
import FontSelector from './FontSelector';
import SizeSlider from './SizeSlider';
import { loadSettings, saveSettings } from '../features/settings';

const SettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const [background, setBackground] = useState('');
    const [intro, setIntro] = useState('');
    const [outro, setOutro] = useState('');
    const [font, setFont] = useState('');
    const [fontPath, setFontPath] = useState('');
    const [fontStyle, setFontStyle] = useState('');
    const [size, setSize] = useState(24);
    const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>('light');
    const [guide, setGuide] = useState(true);

    useEffect(() => {
        loadSettings().then(s => {
            setBackground(s.background || '');
            setIntro(s.intro || '');
            setOutro(s.outro || '');
            setFont(s.captionFont || '');
            setFontPath(s.captionFontPath || '');
            setFontStyle(s.captionStyle || '');
            setSize(s.captionSize || 24);
            setTheme((s.theme as any) || 'light');
            setGuide(s.showGuide !== false);
        });
    }, []);

    const handleSave = async () => {
        await saveSettings({
            background: background || undefined,
            intro: intro || undefined,
            outro: outro || undefined,
            captionFont: font || undefined,
            captionFontPath: fontPath || undefined,
            captionStyle: fontStyle || undefined,
            captionSize: size,
            theme,
            showGuide: guide,
        });
    };

    return (
        <div>
            <h1>{t('settings')}</h1>
            <div>
                <FilePicker
                    label={t('background')}
                    onSelect={p => {
                        if (typeof p === 'string') setBackground(p);
                        else if (Array.isArray(p) && p.length) setBackground(p[0]);
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {background && <span>{background}</span>}
            </div>
            <div>
                <FilePicker
                    label={t('intro')}
                    onSelect={p => {
                        if (typeof p === 'string') setIntro(p);
                        else if (Array.isArray(p) && p.length) setIntro(p[0]);
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {intro && <span>{intro}</span>}
            </div>
            <div>
                <FilePicker
                    label={t('outro')}
                    onSelect={p => {
                        if (typeof p === 'string') setOutro(p);
                        else if (Array.isArray(p) && p.length) setOutro(p[0]);
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {outro && <span>{outro}</span>}
            </div>
            <div>
                <FontSelector
                    value={font ? { name: font, path: fontPath, style: fontStyle } : null}
                    onChange={f => {
                        setFont(f?.name || '');
                        setFontPath(f?.path || '');
                        setFontStyle(f?.style || '');
                    }}
                />
            </div>
            <div>
                <SizeSlider value={size} onChange={setSize} />
                <span>{size}</span>
            </div>
            <div>
                <label>Theme</label>
                <select value={theme} onChange={e => setTheme(e.target.value as any)}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="high-contrast">High Contrast</option>
                </select>
            </div>
            <button onClick={handleSave}>{t('save')}</button>
        </div>
    );
};

export default SettingsPage;
