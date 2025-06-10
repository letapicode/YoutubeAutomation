import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilePicker from './FilePicker';
import { uploadVideo } from '../features/youtube';
import UploadIcon from './UploadIcon';

const BatchUploader: React.FC = () => {
    const { t } = useTranslation();
    const [files, setFiles] = useState<string[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, number>>({});
    const [running, setRunning] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [publishDate, setPublishDate] = useState('');

    const handleSelect = (p: string | string[] | null) => {
        if (Array.isArray(p)) setFiles(p);
        else if (typeof p === 'string') setFiles([p]);
    };

    const startUpload = async () => {
        if (!files.length) return;
        setRunning(true);
        const prog: Record<string, number> = {};
        setProgressMap({});
        for (const file of files) {
            prog[file] = 0;
            setProgressMap({ ...prog });
            await uploadVideo({
                file,
                title: title || undefined,
                description: description || undefined,
                tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
                publishAt: publishDate ? new Date(publishDate).toISOString() : undefined,
            });
            prog[file] = 100;
            setProgressMap({ ...prog });
        }
        setRunning(false);
    };

    return (
        <div className="batch-uploader">
            <h3>{t('batch_upload')}</h3>
            <div className="row">
                <FilePicker multiple onSelect={handleSelect} label={t('select_videos')} filters={[{ name: 'Videos', extensions: ['mp4'] }]} />
                {files.length > 0 && <p>{t('files_selected', { count: files.length })}</p>}
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
