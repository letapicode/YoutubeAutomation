// Main application component driving the single-video workflow.
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateVideo } from './features/processing';
import { listen } from '@tauri-apps/api/event';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { watchDirectory } from './features/watch';
import { remove } from '@tauri-apps/plugin-fs';
import { tempDir } from '@tauri-apps/api/path';
import YouTubeAuthButton from './components/YouTubeAuthButton';
import { generateUpload, GenerateParams } from './features/youtube';
import FilePicker from './components/FilePicker';
import BatchPage from './components/BatchPage';
import SettingsPage from './components/SettingsPage';
import ProfilesPage from './components/ProfilesPage';
import FontSelector from './components/FontSelector';
import SizeSlider from './components/SizeSlider';
import { languages, Language } from './features/languages';
import TranscribeButton from './components/TranscribeButton';
import { loadSettings, saveSettings } from './features/settings';
import { saveProfile } from './features/profiles';
import type { Profile } from './schema';
import Modal from './components/Modal';
import UploadIcon from './components/UploadIcon';
import SettingsIcon from './components/SettingsIcon';
import OnboardingModal from './components/OnboardingModal';
import WatchStatus from './components/WatchStatus';
import SubtitleEditor from './components/SubtitleEditor';
import { notify } from './utils/notify';
import UpdateModal from './components/UpdateModal';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const App: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState<'single' | 'batch' | 'settings' | 'profiles'>('single');
    const [file, setFile] = useState('');
    const [background, setBackground] = useState('');
    const [captions, setCaptions] = useState('');
    const [intro, setIntro] = useState('');
    const [outro, setOutro] = useState('');
    const [watermark, setWatermark] = useState('');
    const [watermarkPos, setWatermarkPos] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
    const [translations, setTranslations] = useState<string[]>([]);
    const [font, setFont] = useState('');
    const [fontPath, setFontPath] = useState('');
    const [fontStyle, setFontStyle] = useState('');
    const [size, setSize] = useState(24);
    const [position, setPosition] = useState('bottom');
    const [language, setLanguage] = useState<Language>('auto');
    const [width, setWidth] = useState(1280);
    const [height, setHeight] = useState(720);
    const [theme, setTheme] = useState<'light' | 'dark' | 'high'>(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'high' || stored === 'light') {
            return stored as any;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [captionColor, setCaptionColor] = useState('#ffffff');
    const [captionBg, setCaptionBg] = useState('#000000');
    const [progress, setProgress] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [outputs, setOutputs] = useState<string[]>([]);
    const [preview, setPreview] = useState('');
    const [showGuide, setShowGuide] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [privacy, setPrivacy] = useState('public');
    const [playlistId, setPlaylistId] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [showEditor, setShowEditor] = useState(false);



    useEffect(() => {
        loadSettings().then(s => {
            if (s.background) setBackground(s.background);
            if (s.intro) setIntro(s.intro);
            if (s.outro) setOutro(s.outro);
            if (s.captionFont) setFont(s.captionFont);
            if (s.captionFontPath) setFontPath(s.captionFontPath);
            if (s.captionStyle) setFontStyle(s.captionStyle);
            if (s.captionSize) setSize(s.captionSize);
            if (s.captionColor) setCaptionColor(s.captionColor);
            if (s.captionBg) setCaptionBg(s.captionBg);
            if (s.watermark) setWatermark(s.watermark);
            if (s.watermarkPosition) setWatermarkPos(s.watermarkPosition as any);
            if (s.showGuide !== false) setShowGuide(true);
            if (s.watchDir) {
                watchDirectory(s.watchDir, { autoUpload: s.autoUpload });
            }
        });
        check().then(res => {
            if (res) setShowUpdate(true);
        }).catch(() => {});
        const unlisten = listen('tauri://update-available', () => setShowUpdate(true));
        return () => {
            unlisten.then(f => f());
        };
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const lang = languages.find(l => l.value === i18n.language);
        document.documentElement.dir = lang && lang.rtl ? 'rtl' : 'ltr';
    }, [i18n.language]);

    const toggleTheme = () =>
        setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'high' : 'light');


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
            captionOptions: {
                font: font || undefined,
                fontPath: fontPath || undefined,
                style: fontStyle || undefined,
                size,
                position,
                color: captionColor,
                background: captionBg,
            },
            background: background || undefined,
            watermark: watermark || undefined,
            watermarkPosition: watermarkPos,
            intro: intro || undefined,
            outro: outro || undefined,
            width,
            height,
        }, p => setProgress(Math.round(p)), () => setGenerating(false));
        setOutputs(o => [...o, out]);
        setGenerating(false);
        notify('Generation complete', 'Video created successfully');
    };

    const buildParams = (): GenerateParams => ({
        file,
        captions: captions || undefined,
        captionOptions: {
            font: font || undefined,
            fontPath: fontPath || undefined,
            style: fontStyle || undefined,
            size,
            position,
            color: captionColor,
            background: captionBg,
        },
        background: background || undefined,
        watermark: watermark || undefined,
        watermarkPosition: watermarkPos,
        intro: intro || undefined,
        outro: outro || undefined,
        width,
        height,
        title: title || undefined,
        description: description || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        publishAt: publishDate || undefined,
        thumbnail: thumbnail || undefined,
        privacy: privacy || undefined,
        playlistId: playlistId || undefined,
    });

    const handleSaveCurrentProfile = async () => {
        const name = prompt(t('save_profile')) || '';
        if (!name) return;
        const p: Profile = {
            captions: captions || undefined,
            captionOptions: {
                font: font || undefined,
                fontPath: fontPath || undefined,
                style: fontStyle || undefined,
                size,
                position,
                color: captionColor,
                background: captionBg,
            },
            background: background || undefined,
            intro: intro || undefined,
            outro: outro || undefined,
            watermark: watermark || undefined,
            watermarkPosition: watermarkPos,
            width,
            height,
            title: title || undefined,
            description: description || undefined,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
            publishAt: publishDate || undefined,
            thumbnail: thumbnail || undefined,
        };
        await saveProfile(name, p);
    };

    const closePreview = async () => {
        if (preview) {
            try {
                const tmp = await tempDir();
                if (preview.startsWith(tmp)) {
                    await remove(preview);
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
            captionFontPath: fontPath || undefined,
            captionStyle: fontStyle || undefined,
            captionSize: size,
            captionColor: captionColor,
            captionBg: captionBg,
            watermark: watermark || undefined,
            watermarkPosition: watermarkPos,
            showGuide: false,
        });
    };

    const applyProfile = (p: Profile) => {
        setBackground(p.background || '');
        setIntro(p.intro || '');
        setOutro(p.outro || '');
        setCaptions(p.captions || '');
        setWatermark(p.watermark || '');
        if (p.watermarkPosition) setWatermarkPos(p.watermarkPosition as any);
        if (p.captionOptions) {
            setFont(p.captionOptions.font || '');
            setFontPath(p.captionOptions.fontPath || '');
            setFontStyle(p.captionOptions.style || '');
            if (p.captionOptions.size) setSize(p.captionOptions.size);
            if (p.captionOptions.position) setPosition(p.captionOptions.position);
            if (p.captionOptions.color) setCaptionColor(p.captionOptions.color);
            if (p.captionOptions.background) setCaptionBg(p.captionOptions.background);
        }
        if (p.width) setWidth(p.width);
        if (p.height) setHeight(p.height);
        setTitle(p.title || '');
        setDescription(p.description || '');
        setTags(p.tags ? p.tags.join(', ') : '');
        setPublishDate(p.publishAt || '');
        setThumbnail(p.thumbnail || '');
    };

    const handleGenerateUpload = async () => {
        if (!file) return;
        setGenerating(true);
        setProgress(0);
        const unlisten = await listen<number>('generate_progress', e => {
            if (typeof e.payload === 'number') setProgress(Math.round(e.payload));
        });
        await generateUpload(buildParams(), () => setGenerating(false));
        unlisten();
        setGenerating(false);
        notify('Upload complete', 'Video uploaded successfully');
    };

    const cancelGenerate = async () => {
        await invoke('cancel_generate');
    };

    const cancelUpload = async () => {
        await invoke('cancel_upload');
    };

    const handleUpdateApp = async () => {
        const res = await check();
        if (res) {
            await res.downloadAndInstall();
            await relaunch();
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'g') {
                    handleGenerate();
                    e.preventDefault();
                } else if (e.key === 'u') {
                    handleGenerateUpload();
                    e.preventDefault();
                } else if (e.key === 's') {
                    setPage('settings');
                    e.preventDefault();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleGenerateUpload, handleGenerate, setPage]);

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

    if (page === 'profiles') {
        return (
            <div className="app">
                <div className="row">
                    <button onClick={() => setPage('single')}>{t('back')}</button>
                </div>
                <ProfilesPage onLoad={p => { applyProfile(p); setPage('single'); }} />
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
                    {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
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
                <FilePicker
                    label={t('watermark')}
                    onSelect={(p) => {
                        if (typeof p === 'string') setWatermark(p);
                        else if (Array.isArray(p) && p.length) setWatermark(p[0]);
                    }}
                    filters={[{ name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }]}
                />
                {watermark && <span>{watermark}</span>}
            </div>
            <div className="row">
                <label>{t('watermark_position')}</label>
                <select value={watermarkPos} onChange={e => setWatermarkPos(e.target.value as any)}>
                    <option value="top-left">{t('top_left')}</option>
                    <option value="top-right">{t('top_right')}</option>
                    <option value="bottom-left">{t('bottom_left')}</option>
                    <option value="bottom-right">{t('bottom_right')}</option>
                </select>
            </div>
            <div className="row">
                <TranscribeButton
                    file={file}
                    language={language}
                    targets={translations}
                    onComplete={handleTranscriptionComplete}
                />
                <FilePicker
                    label="Captions"
                    onSelect={p => {
                        if (typeof p === 'string') setCaptions(p);
                        else if (Array.isArray(p) && p.length) setCaptions(p[0]);
                    }}
                    filters={[{ name: 'Subtitles', extensions: ['srt'] }]}
                />
                {captions && (
                    <>
                        <span>{captions}</span>
                        <button onClick={() => setShowEditor(true)}>{t('edit_captions')}</button>
                    </>
                )}
            </div>
            <div className="row">
                <input type="text" placeholder={t('video_title')} value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="row">
                <textarea placeholder={t('description')} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="row">
                <input type="text" placeholder={t('tags')} value={tags} onChange={e => setTags(e.target.value)} />
            </div>
            <div className="row">
                <input type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} />
            </div>
            <div className="row">
                <label>{t('privacy')}</label>
                <select value={privacy} onChange={e => setPrivacy(e.target.value)}>
                    <option value="public">public</option>
                    <option value="unlisted">unlisted</option>
                    <option value="private">private</option>
                </select>
            </div>
            <div className="row">
                <input type="text" placeholder="Playlist ID" value={playlistId} onChange={e => setPlaylistId(e.target.value)} />
            </div>
            <div className="row">
                <FilePicker
                    label={t('thumbnail')}
                    onSelect={(p) => {
                        if (typeof p === 'string') setThumbnail(p);
                        else if (Array.isArray(p) && p.length) setThumbnail(p[0]);
                    }}
                    filters={[{ name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }]}
                />
                {thumbnail && <span>{thumbnail}</span>}
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
                <FontSelector
                    value={font ? { name: font, path: fontPath, style: fontStyle } : null}
                    onChange={f => {
                        setFont(f?.name || '');
                        setFontPath(f?.path || '');
                        setFontStyle(f?.style || '');
                    }}
                />
            </div>
            <div className="row">
                <SizeSlider value={size} onChange={setSize} />
                <span>{size}</span>
            </div>
            <div className="row">
                <label>{t('caption_color')}</label>
                <input type="color" value={captionColor} onChange={e => setCaptionColor(e.target.value)} />
                <label>{t('caption_bg')}</label>
                <input type="color" value={captionBg} onChange={e => setCaptionBg(e.target.value)} />
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
                    {languages.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div className="row">
                {languages.filter(opt => opt.value !== 'auto').map(opt => (
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
                <button onClick={handleSaveCurrentProfile}>{t('save_profile')}</button>
                <button onClick={() => setPage('batch')}>{t('batch_tools')}</button>
                <button onClick={() => setPage('profiles')}>{t('profiles')}</button>
                <button onClick={() => setPage('settings')}>
                    <SettingsIcon />
                    {t('settings')}
                </button>
            </div>
            {generating && (
                <div className="row">
                    <progress value={progress} max={100} />
                    <span>{progress}%</span>
                    <button onClick={() => { cancelGenerate(); cancelUpload(); }}>{t('cancel')}</button>
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
            <Modal open={showEditor} onClose={() => setShowEditor(false)}>
                {captions && (
                    <SubtitleEditor
                        file={captions}
                        onClose={() => setShowEditor(false)}
                        onSaved={(p) => { setCaptions(p); setShowEditor(false); }}
                    />
                )}
            </Modal>
            <WatchStatus />
            <UpdateModal open={showUpdate} onUpdate={handleUpdateApp} onClose={() => setShowUpdate(false)} />
            <OnboardingModal open={showGuide} onClose={dismissGuide} />
        </div>
    );
};

export default App;
