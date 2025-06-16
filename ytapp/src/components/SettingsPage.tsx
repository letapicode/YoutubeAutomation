// Application settings page where default options are persisted.
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
    const [captionColor, setCaptionColor] = useState('#ffffff');
    const [captionBg, setCaptionBg] = useState('#000000');
    const [watermark, setWatermark] = useState('');
    const [watermarkPos, setWatermarkPos] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
    const [guide, setGuide] = useState(true);
    const [watchDir, setWatchDir] = useState('');
    const [autoUpload, setAutoUpload] = useState(false);
    const [modelSize, setModelSize] = useState('base');
    const [output, setOutput] = useState('');
    const [maxRetries, setMaxRetries] = useState(3);

    useEffect(() => {
        loadSettings().then(s => {
            setBackground(s.background || '');
            setIntro(s.intro || '');
            setOutro(s.outro || '');
            setFont(s.captionFont || '');
            setFontPath(s.captionFontPath || '');
            setFontStyle(s.captionStyle || '');
            setSize(s.captionSize || 24);
            if (s.captionColor) setCaptionColor(s.captionColor);
            if (s.captionBg) setCaptionBg(s.captionBg);
            if (s.watermark) setWatermark(s.watermark);
            if (s.watermarkPosition) setWatermarkPos(s.watermarkPosition as any);
            setGuide(s.showGuide !== false);
            setWatchDir(s.watchDir || '');
            setAutoUpload(!!s.autoUpload);
            setOutput(s.output || '');
            if (s.modelSize) setModelSize(s.modelSize);
            if (typeof s.maxRetries === 'number') setMaxRetries(s.maxRetries);
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
            captionColor,
            captionBg,
            watermark: watermark || undefined,
            watermarkPosition: watermarkPos,
            showGuide: guide,
            watchDir: watchDir || undefined,
            autoUpload,
            output: output || undefined,
            modelSize,
            maxRetries,
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
                <FilePicker
                    label="Output"
                    onSelect={p => {
                        if (typeof p === 'string') setOutput(p);
                        else if (Array.isArray(p) && p.length) setOutput(p[0]);
                    }}
                    filters={[{ name: 'Video', extensions: ['mp4'] }]}
                />
                {output && <span>{output}</span>}
            </div>
            <div>
                <FilePicker
                    label={t('watermark')}
                    onSelect={p => {
                        if (typeof p === 'string') setWatermark(p);
                        else if (Array.isArray(p) && p.length) setWatermark(p[0]);
                    }}
                    filters={[{ name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }]}
                />
                {watermark && <span>{watermark}</span>}
            </div>
            <div>
                <label>{t('watermark_position')}</label>
                <select value={watermarkPos} onChange={e => setWatermarkPos(e.target.value as any)}>
                    <option value="top-left">{t('top_left')}</option>
                    <option value="top-right">{t('top_right')}</option>
                    <option value="bottom-left">{t('bottom_left')}</option>
                    <option value="bottom-right">{t('bottom_right')}</option>
                </select>
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
                <label>{t('caption_color')}</label>
                <input type="color" value={captionColor} onChange={e => setCaptionColor(e.target.value)} />
                <label>{t('caption_bg')}</label>
                <input type="color" value={captionBg} onChange={e => setCaptionBg(e.target.value)} />
            </div>
            <div>
                <label>{t('whisper_size')}</label>
                <select value={modelSize} onChange={e => setModelSize(e.target.value)}>
                    <option value="tiny">tiny</option>
                    <option value="base">base</option>
                    <option value="small">small</option>
                    <option value="medium">medium</option>
                    <option value="large">large</option>
                </select>
            </div>
            <div>
                <label>{t('watch_directory')}</label>
                <input type="text" value={watchDir} onChange={e => setWatchDir(e.target.value)} />
                <label>{t('auto_upload')}</label>
                <input type="checkbox" checked={autoUpload} onChange={e => setAutoUpload(e.target.checked)} />
            </div>
            <div>
                <label>{t('max_retries')}</label>
                <input type="number" min="1" value={maxRetries} onChange={e => setMaxRetries(parseInt(e.target.value, 10) || 1)} />
            </div>
            <button onClick={handleSave}>{t('save')}</button>
        </div>
    );
};

export default SettingsPage;
