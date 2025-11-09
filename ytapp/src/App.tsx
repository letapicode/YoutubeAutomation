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
import LanguageSelector from './components/LanguageSelector';
import PlaylistSelector from './components/PlaylistSelector';
import SizeSlider from './components/SizeSlider';
import Section from './components/Section';
import Accordion from './components/Accordion';
import ActionBar from './components/ActionBar';
import { languages, Language } from './features/languages';
import TranscribeButton from './components/TranscribeButton';
import { loadSettings, saveSettings } from './features/settings';
import { saveProfile } from './features/profiles';
import type { Profile } from './schema';
import Modal from './components/Modal';
import UploadIcon from './components/UploadIcon';
import SettingsIcon from './components/SettingsIcon';
import WatchStatus from './components/WatchStatus';
import SubtitleEditor from './components/SubtitleEditor';
import { notify } from './utils/notify';
import UpdateModal from './components/UpdateModal';
import QueuePage from './components/QueuePage';
import LogsPage from './components/LogsPage';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const App: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [page, setPage] = useState<'single' | 'batch' | 'settings' | 'profiles' | 'queue' | 'logs'>('single');
    const [file, setFile] = useState('');
    const [background, setBackground] = useState('');
    const [captions, setCaptions] = useState('');
    const [intro, setIntro] = useState('');
    const [outro, setOutro] = useState('');
    const [watermark, setWatermark] = useState('');
    const [watermarkPos, setWatermarkPos] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
    const [watermarkOpacity, setWatermarkOpacity] = useState(1);
    const [watermarkScale, setWatermarkScale] = useState(0.2);
    const [translations, setTranslations] = useState<Language[]>([]);
    const [font, setFont] = useState('');
    const [fontPath, setFontPath] = useState('');
    const [fontStyle, setFontStyle] = useState('');
    const [size, setSize] = useState(24);
    const [position, setPosition] = useState('bottom');
    const [language, setLanguage] = useState<Language>('auto');
    const [width, setWidth] = useState(1920);
    const [height, setHeight] = useState(1080);
    const [fps, setFps] = useState(25);
    const [theme, setTheme] = useState<'light' | 'dark' | 'high' | 'solarized'>(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'high' || stored === 'light' || stored === 'solarized') {
            return stored as any;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [captionColor, setCaptionColor] = useState('#ffffff');
    const [captionBg, setCaptionBg] = useState('#000000');
    const [uiFont, setUiFont] = useState('');
    const [accentColor, setAccentColor] = useState('#ff9500');
    const [progress, setProgress] = useState(0);
    const [announcement, setAnnouncement] = useState('');
    const [generating, setGenerating] = useState(false);
    const [outputs, setOutputs] = useState<string[]>([]);
    const [preview, setPreview] = useState('');
    const [showUpdate, setShowUpdate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [privacy, setPrivacy] = useState('public');
    const [playlistId, setPlaylistId] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [output, setOutput] = useState('');



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
            if (s.uiFont) {
                setUiFont(s.uiFont);
                document.body.style.fontFamily = s.uiFont;
            }
            if (s.accentColor) setAccentColor(s.accentColor);
            if (s.theme) setTheme(s.theme as any);
            if (s.watermark) setWatermark(s.watermark);
            if (s.watermarkPosition) setWatermarkPos(s.watermarkPosition as any);
            if (typeof s.watermarkOpacity === 'number') setWatermarkOpacity(s.watermarkOpacity);
            if (typeof s.watermarkScale === 'number') setWatermarkScale(s.watermarkScale);
            if (s.output) setOutput(s.output);
            if (typeof s.defaultWidth === 'number') setWidth(s.defaultWidth);
            if (typeof s.defaultHeight === 'number') setHeight(s.defaultHeight);
            if (typeof s.defaultFps === 'number') setFps(s.defaultFps);
            if (s.defaultPrivacy) setPrivacy(s.defaultPrivacy);
            if (s.defaultPlaylistId) setPlaylistId(s.defaultPlaylistId);
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
        document.documentElement.style.setProperty('--accent-color', accentColor);
    }, [accentColor]);

    useEffect(() => {
        document.body.style.fontFamily = uiFont || '';
    }, [uiFont]);

    useEffect(() => {
        const lang = languages.find(l => l.value === i18n.language);
        document.documentElement.dir = lang && lang.rtl ? 'rtl' : 'ltr';
    }, [i18n.language]);

    const toggleTheme = async () => {
        const next =
            theme === 'light'
                ? 'dark'
                : theme === 'dark'
                ? 'high'
                : theme === 'high'
                ? 'solarized'
                : 'light';
        setTheme(next);
        try {
            const current = await loadSettings();
            await saveSettings({ ...current, theme: next });
        } catch {
            // ignore persistence errors
        }
    };


    const handleTranscriptionComplete = (srts: string[]) => {
        if (srts.length) setCaptions(srts[0]);
    };

    const handleGenerate = async () => {
        if (!file) return;
        setGenerating(true);
        setProgress(0);
        const out = await generateVideo({
            file,
            output: output || undefined,
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
            watermarkOpacity,
            watermarkScale,
            intro: intro || undefined,
            outro: outro || undefined,
            width,
            height,
        }, p => {
            const pct = Math.round(p);
            setProgress(pct);
            setAnnouncement(`Generating... ${pct}%`);
        }, () => setGenerating(false));
        setOutputs(o => [...o, out]);
        setGenerating(false);
        setAnnouncement('');
        notify('Generation complete', 'Video created successfully');
    };

    const buildParams = (): GenerateParams => ({
        file,
        output: output || undefined,
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
        watermarkOpacity,
        watermarkScale,
        intro: intro || undefined,
        outro: outro || undefined,
        width,
        height,
        fps,
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
            watermarkOpacity,
            watermarkScale,
            width,
            height,
            fps,
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

    const applyProfile = (p: Profile) => {
        setBackground(p.background || '');
        setIntro(p.intro || '');
        setOutro(p.outro || '');
        setCaptions(p.captions || '');
        setWatermark(p.watermark || '');
        if (p.watermarkPosition) setWatermarkPos(p.watermarkPosition as any);
        if (typeof p.watermarkOpacity === 'number') setWatermarkOpacity(p.watermarkOpacity);
        if (typeof p.watermarkScale === 'number') setWatermarkScale(p.watermarkScale);
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
        if (p.fps) setFps(p.fps);
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
            if (typeof e.payload === 'number') {
                const pct = Math.round(e.payload);
                setProgress(pct);
                setAnnouncement(`Upload... ${pct}%`);
            }
        });
        await generateUpload(buildParams(), () => setGenerating(false));
        unlisten();
        setGenerating(false);
        setAnnouncement('');
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

    if (page === 'queue') {
        return (
            <div className="app">
                <div className="row">
                    <button onClick={() => setPage('single')}>{t('back')}</button>
                </div>
                <QueuePage />
            </div>
        );
    }

    if (page === 'logs') {
        return (
            <div className="app">
                <div className="row">
                    <button onClick={() => setPage('single')}>{t('back')}</button>
                </div>
                <LogsPage />
            </div>
        );
    }

    return (
        <div className="app">
            <div className="toolbar">
                <div className="toolbar__title">
                    <h1>{t('title')}</h1>
                </div>
                <div className="toolbar__controls">
                    <button onClick={toggleTheme}>{t('toggle_theme')}</button>
                </div>
            </div>
            <div className="form-grid">
                <Section title={t('media_inputs')}>
                    <div className="stack">
            <div className="row">
                <FilePicker label={t('select_audio')} useDropZone onSelect={(p) => {
                    if (typeof p === 'string') setFile(p);
                    else if (Array.isArray(p) && p.length) setFile(p[0]);
                }} />
                {file && <span>{file}</span>}
            </div>
            <div className="row">
                <FilePicker label="Output" onSelect={(p) => {
                    if (typeof p === 'string') setOutput(p);
                    else if (Array.isArray(p) && p.length) setOutput(p[0]);
                }} filters={[{ name: 'Video', extensions: ['mp4'] }]} />
                {output && <span>{output}</span>}
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
                <label>{t('watermark_opacity')}</label>
                <input type="number" min="0" max="1" step="0.05" value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseFloat(e.target.value))} />
                <label>{t('watermark_scale')}</label>
                <input type="number" min="0" max="1" step="0.05" value={watermarkScale} onChange={e => setWatermarkScale(parseFloat(e.target.value))} />
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
                    </div>
                </Section>
                <Section title={t('video_metadata')}>
                    <div className="stack">
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
                <label>{t('playlist')}</label>
                <PlaylistSelector value={playlistId} onChange={setPlaylistId} />
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
                    </div>
                </Section>
            </div>
            <Accordion title={t('advanced_settings')}>
                <div className="stack">
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
            <div className="row">
                <label>FPS</label>
                <input type="number" min="1" value={fps} onChange={e => setFps(parseInt(e.target.value, 10) || 1)} />
            </div>
                </div>
            </Accordion>
            <Section title={t('transcription_languages')} description={t('transcription_languages_hint')}>
                <div className="stack">
                    <LanguageSelector
                        label={t('primary_language')}
                        value={language}
                        onChange={setLanguage}
                    />
                    <LanguageSelector
                        multiple
                        includeAuto={false}
                        value={translations}
                        onChange={setTranslations}
                        placeholder={t('language_multi_placeholder')}
                    />
                </div>
            </Section>
            <ActionBar>
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
                <button onClick={() => setPage('queue')}>{t('queue')}</button>
                <button onClick={() => setPage('logs')}>{t('logs')}</button>
            </ActionBar>
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
                    <div className="video-preview">
                        <video
                            src={convertFileSrc(preview)}
                            controls
                        />
                    </div>
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
            <div aria-live="polite" className="sr-only">{announcement}</div>
            <UpdateModal open={showUpdate} onUpdate={handleUpdateApp} onClose={() => setShowUpdate(false)} />
        </div>
    );
};

export default App;
