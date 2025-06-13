// Uploads a list of video files to YouTube one after another.
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilePicker from './FilePicker';
import { uploadVideo } from '../features/youtube';
import UploadIcon from './UploadIcon';
import { open } from '@tauri-apps/plugin-dialog';
import { parseCsv, CsvRow } from '../utils/csv';
import { notify } from '../utils/notify';

const BatchUploader: React.FC = () => {
    const { t } = useTranslation();
    const [files, setFiles] = useState<string[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, number>>({});
    const [running, setRunning] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [publishDate, setPublishDate] = useState('');
    const [privacy, setPrivacy] = useState('public');
    const [playlistId, setPlaylistId] = useState('');
    const [csvMap, setCsvMap] = useState<Record<string, CsvRow>>({});
    const [csvWarning, setCsvWarning] = useState(false);

    const handleSelect = (p: string | string[] | null) => {
        if (Array.isArray(p)) {
            setFiles(p);
            setCsvWarning(p.some(f => !csvMap[f]));
        } else if (typeof p === 'string') {
            setFiles([p]);
            setCsvWarning(!csvMap[p]);
        }
    };

    const importCsv = async () => {
        const sel = await open({ filters: [{ name: 'CSV', extensions: ['csv'] }] });
        if (typeof sel === 'string') {
            const rows = await parseCsv(sel);
            const map: Record<string, CsvRow> = {};
            rows.forEach(r => { map[r.file] = r; });
            setCsvMap(map);
            setCsvWarning(files.some(f => !map[f]));
        }
    };

    const startUpload = async () => {
        if (!files.length) return;
        setRunning(true);
        const prog: Record<string, number> = {};
        setProgressMap({});
        for (const file of files) {
            prog[file] = 0;
            setProgressMap({ ...prog });
            const meta = csvMap[file] || {};
            await uploadVideo(
                {
                    file,
                    title: meta.title || title || undefined,
                    description: meta.description || description || undefined,
                    tags: meta.tags || (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined),
                    publishAt: meta.publishAt || (publishDate ? new Date(publishDate).toISOString() : undefined),
                    privacy: privacy || undefined,
                    playlistId: playlistId || undefined,
                },
                (p) => {
                    prog[file] = Math.round(p);
                    setProgressMap({ ...prog });
                },
            );
        }
        setRunning(false);
        notify('Batch upload complete', `${files.length} video(s) uploaded`);
    };

    return (
        <div className="batch-uploader">
            <h3>{t('batch_upload')}</h3>
            <div className="row">
                <FilePicker multiple onSelect={handleSelect} label={t('select_videos')} filters={[{ name: 'Videos', extensions: ['mp4'] }]} />
                {files.length > 0 && <p>{t('files_selected', { count: files.length })}</p>}
            </div>
            <div className="row">
                <button onClick={importCsv}>{t('import_csv')}</button>
                {csvWarning && <span style={{ color: 'red' }}>{t('missing_in_csv')}</span>}
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
                <button onClick={startUpload} disabled={running || !files.length}>
                    <UploadIcon />
                    {t('upload')}
                </button>
            </div>
            {files.map(f => (
                <div className="row" key={f}>
                    <span>{f}</span>
                    {running && <progress value={progressMap[f] || 0} max={100} />}
                    {!running && progressMap[f] === 100 && <span>{t('done')}</span>}
                </div>
            ))}
        </div>
    );
};

export default BatchUploader;
