import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateVideo } from './features/processing';
import { listen } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';
import { removeFile } from '@tauri-apps/api/fs';
import { tempDir } from '@tauri-apps/api/path';
import YouTubeAuthButton from './components/YouTubeAuthButton';
import { generateUpload, GenerateParams } from './features/youtube';
import FilePicker from './components/FilePicker';
import BatchPage from './components/BatchPage';
import SettingsPage from './components/SettingsPage';
import FontSelector from './components/FontSelector';
import SizeSlider from './components/SizeSlider';
import { languageOptions, Language } from './features/language';
import TranscribeButton from './components/TranscribeButton';
import { loadSettings, saveSettings } from './features/settings';
import Modal from './components/Modal';
import UploadIcon from './components/UploadIcon';
import SettingsIcon from './components/SettingsIcon';
import OnboardingModal from './components/OnboardingModal';

const App: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState<'single' | 'batch' | 'settings'>('single');
    const [file, setFile] = useState('');
    const [background, setBackground] = useState('');
    const [captions, setCaptions] = useState('');
    const [intro, setIntro] = useState('');
    const [outro, setOutro] = useState('');
    const [translations, setTranslations] = useState<string[]>([]);
    const [font, setFont] = useState('');
    const [size, setSize] = useState(24);
    const [position, setPosition] = useState('bottom');
    const [language, setLanguage] = useState<Language>('auto');
    const [width, setWidth] = useState(1280);
    const [height, setHeight] = useState(720);
    const [theme, setTheme] = useState<'light' | 'dark'>(() =>
        localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
    );
    const [progress, setProgress] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [outputs, setOutputs] = useState<string[]>([]);
    const [preview, setPreview] = useState('');
    const [showGuide, setShowGuide] = useState(false);


    useEffect(() => {
        loadSettings().then(s => {
            if (s.background) setBackground(s.background);
            if (s.intro) setIntro(s.intro);
            if (s.outro) setOutro(s.outro);
            if (s.captionFont) setFont(s.captionFont);
            if (s.captionSize) setSize(s.captionSize);
            if (s.showGuide !== false) setShowGuide(true);
        });
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

    const handleTranscriptionComplete = (srts: string[]) => {
        if (srts.length) setCaptions(srts[0]);
    };

    const handleGenerate = async () => {
        if (!file) return;
        setGenerating(true);
        setProgress(0);
        const out = await generateVideo({
            file,
            captions: captions || undefined,
            captionOptions: { font: font || undefined, size, position },
            background: background || undefined,
            intro: intro || undefined,
            outro: outro || undefined,
            width,
            height,
        }, p => setProgress(Math.round(p)));
        setOutputs(o => [...o, out]);
        setGenerating(false);
    };

    const buildParams = (): GenerateParams => ({
        file,
        captions: captions || undefined,
        captionOptions: { font: font || undefined, size, position },
        background: background || undefined,
        intro: intro || undefined,
        outro: outro || undefined,
        width,
        height,
    });

    const closePreview = async () => {
        if (preview) {
            try {
                const tmp = await tempDir();
                if (preview.startsWith(tmp)) {
                    await removeFile(preview);
                }
            } catch {
                // ignore cleanup errors
            }
        }
        setPreview('');
    };

    const dismissGuide = async () => {
        setShowGuide(false);
        await saveSettings({
            intro: intro || undefined,
            outro: outro || undefined,
            background: background || undefined,
            captionFont: font || undefined,
            captionSize: size,
            showGuide: false,
        });
    };

    const handleGenerateUpload = async () => {
        if (!file) return;
        setGenerating(true);
        setProgress(0);
        const unlisten = await listen<number>('generate_progress', e => {
            if (typeof e.payload === 'number') setProgress(Math.round(e.payload));
        });
        await generateUpload(buildParams());
        unlisten();
        setGenerating(false);
    };

    if (page === 'batch') {
        return (
            <div className="app">
                <div className="row">
                    <button onClick={() => setPage('single')}>{t('back')}</button>
                </div>
                <BatchPage />
            </div>
        );
    }

    if (page === 'settings') {
        return (
            <div className="app">
                <div className="row">
                    <button onClick={() => setPage('single')}>{t('back')}</button>
                </div>
                <SettingsPage />
            </div>
        );
    }

    return (
        <div className="app">
            <h1>{t('title')}</h1>
            <div className="row">
                <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}>
                    <option value="en">English</option>
                    <option value="ne">नेपाली</option>
                    <option value="hi">हिन्दी</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="zh">中文</option>
                    <option value="ar">العربية</option>
                </select>
                <button onClick={toggleTheme}>{t('toggle_theme')}</button>
            </div>
            <div className="row">
                <FilePicker label={t('select_audio')} useDropZone onSelect={(p) => {
                    if (typeof p === 'string') setFile(p);
                    else if (Array.isArray(p) && p.length) setFile(p[0]);
                }} />
                {file && <span>{file}</span>}
            </div>
            <div className="row">
                <FilePicker
                    useDropZone
                    label={t('background')}
                    onSelect={(p) => {
                        if (typeof p === 'string') setBackground(p);
                        else if (Array.isArray(p) && p.length) setBackground(p[0]);
                    }}
                    filters={[
                        { name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] },
                    ]}
                />
                {background && <span>{background}</span>}
            </div>
            <div className="row">
                <TranscribeButton
                    file={file}
                    language={language}
                    targets={translations}
                    onComplete={handleTranscriptionComplete}
                />
                {captions && <span>{captions}</span>}
            </div>
            <details>
                <summary>{t('advanced_settings')}</summary>
            <div className="row">
                <FilePicker
                    useDropZone
                    label={t('intro')}
                    onSelect={(p) => {
                        if (typeof p === 'string') setIntro(p);
                        else if (Array.isArray(p) && p.length) setIntro(p[0]);
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {intro && <span>{intro}</span>}
            </div>
            <div className="row">
                <FilePicker
                    useDropZone
                    label={t('outro')}
                    onSelect={(p) => {
                        if (typeof p === 'string') setOutro(p);
                        else if (Array.isArray(p) && p.length) setOutro(p[0]);
                    }}
                    filters={[{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'png', 'jpg', 'jpeg'] }]}
                />
                {outro && <span>{outro}</span>}
            </div>
            <div className="row">
                <FontSelector value={font} onChange={setFont} />
            </div>
            <div className="row">
                <SizeSlider value={size} onChange={setSize} />
                <span>{size}</span>
            </div>
            <div className="row">
                <select value={position} onChange={(e) => setPosition(e.target.value)}>
                    <option value="top">{t('top')}</option>
                    <option value="center">{t('center')}</option>
                    <option value="bottom">{t('bottom')}</option>
                </select>
            </div>
            <div className="row">
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
            </details>
            <div className="row">
                <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
                    {languageOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div className="row">
                {languageOptions.filter(opt => opt.value !== 'auto').map(opt => (
                    <label key={opt.value} style={{ marginRight: '0.5em' }}>
                        <input
                            type="checkbox"
                            value={opt.value}
                            checked={translations.includes(opt.value)}
                            onChange={() => {
                                setTranslations(ts => ts.includes(opt.value)
                                    ? ts.filter(t => t !== opt.value)
                                    : [...ts, opt.value]);
                            }}
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
            <div className="row">
                <YouTubeAuthButton />
                <button onClick={handleGenerate}>{t('generate')}</button>
                <button onClick={handleGenerateUpload}>
                    <UploadIcon />
                    {t('generate_upload')}
                </button>
                <button onClick={() => setPage('batch')}>{t('batch_tools')}</button>
                <button onClick={() => setPage('settings')}>
                    <SettingsIcon />
                    {t('settings')}
                </button>
            </div>
            {generating && (
                <div className="row">
                    <progress value={progress} max={100} />
                    <span>{progress}%</span>
                </div>
            )}
            {outputs.map((o, i) => (
                <div className="row" key={i}>
                    <span>{o}</span>
                    <button onClick={() => setPreview(o)}>{t('preview')}</button>
                </div>
            ))}
            <Modal open={!!preview} onClose={closePreview}>
                {preview && (
                    <video
                        src={convertFileSrc(preview)}
                        controls
                        style={{ maxWidth: '100%', maxHeight: '80vh' }}
                    />
                )}
            </Modal>
            <OnboardingModal open={showGuide} onClose={dismissGuide} />
        </div>
    );
};

export default App;
