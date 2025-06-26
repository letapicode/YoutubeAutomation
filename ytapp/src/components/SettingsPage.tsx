// Application settings page where default options are persisted.
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FilePicker from './FilePicker';
import FontSelector from './FontSelector';
import SizeSlider from './SizeSlider';
import CaptionPreview from './CaptionPreview';
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
    const [uiFont, setUiFont] = useState('');
    const [accentColor, setAccentColor] = useState('#ff9500');
    const [theme, setTheme] = useState<'light' | 'dark' | 'high' | 'solarized'>('light');
    const [watermark, setWatermark] = useState('');
    const [watermarkPos, setWatermarkPos] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
    const [watermarkOpacity, setWatermarkOpacity] = useState(1);
    const [watermarkScale, setWatermarkScale] = useState(0.2);
    const [guide, setGuide] = useState(true);
    const [watchDir, setWatchDir] = useState('');
    const [autoUpload, setAutoUpload] = useState(false);
    const [modelSize, setModelSize] = useState('base');
    const [output, setOutput] = useState('');
    const [maxRetries, setMaxRetries] = useState(3);
    const [width, setWidth] = useState(1280);
    const [height, setHeight] = useState(720);

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
            if (s.uiFont) setUiFont(s.uiFont);
            if (s.accentColor) setAccentColor(s.accentColor);
            if (s.theme) setTheme(s.theme as any);
            if (s.watermark) setWatermark(s.watermark);
            if (s.watermarkPosition) setWatermarkPos(s.watermarkPosition as any);
            if (typeof s.watermarkOpacity === 'number') setWatermarkOpacity(s.watermarkOpacity);
            if (typeof s.watermarkScale === 'number') setWatermarkScale(s.watermarkScale);
            setGuide(s.showGuide !== false);
            setWatchDir(s.watchDir || '');
            setAutoUpload(!!s.autoUpload);
            setOutput(s.output || '');
            if (s.modelSize) setModelSize(s.modelSize);
            if (typeof s.maxRetries === 'number') setMaxRetries(s.maxRetries);
            if (typeof s.defaultWidth === 'number') setWidth(s.defaultWidth);
            if (typeof s.defaultHeight === 'number') setHeight(s.defaultHeight);
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
            uiFont: uiFont || undefined,
            watermark: watermark || undefined,
            watermarkPosition: watermarkPos,
            watermarkOpacity,
            watermarkScale,
            showGuide: guide,
            watchDir: watchDir || undefined,
            autoUpload,
            output: output || undefined,
            modelSize,
            maxRetries,
            defaultWidth: width,
            defaultHeight: height,
            accentColor,
            theme,
        });
        document.body.style.fontFamily = uiFont || '';
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
                <label>{t('watermark_opacity')}</label>
                <input type="number" min="0" max="1" step="0.05" value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseFloat(e.target.value))} />
                <label>{t('watermark_scale')}</label>
                <input type="number" min="0" max="1" step="0.05" value={watermarkScale} onChange={e => setWatermarkScale(parseFloat(e.target.value))} />
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
                <label>{t('ui_font')}</label>
                <FontSelector
                    value={uiFont ? { name: uiFont } : null}
                    onChange={f => setUiFont(f?.name || '')}
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
                <label>Accent</label>
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                <label>{t('theme')}</label>
                <select value={theme} onChange={e => setTheme(e.target.value as any)}>
                    <option value="light">light</option>
                    <option value="dark">dark</option>
                    <option value="high">high</option>
                    <option value="solarized">solarized</option>
                </select>
            </div>
            <div>
                <label>{t('resolution')}</label>
                <select
                    value={`${width}x${height}`}
                    onChange={e => {
                        const [w, h] = e.target.value.split('x').map(v => parseInt(v, 10));
                        setWidth(w);
                        setHeight(h);
                    }}
                >
                    <option value="640x360">640x360</option>
                    <option value="1280x720">1280x720</option>
                    <option value="1920x1080">1920x1080</option>
                    <option value="720x1280">720x1280</option>
                    <option value="1080x1920">1080x1920</option>
                </select>
            </div>
            <CaptionPreview
                font={font}
                size={size}
                color={captionColor}
                background={captionBg}
                position="bottom"
            />
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
