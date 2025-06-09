import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilePicker from './FilePicker';
import { uploadVideo } from '../features/youtube';

const BatchUploader: React.FC = () => {
    const { t } = useTranslation();
    const [files, setFiles] = useState<string[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, number>>({});
    const [running, setRunning] = useState(false);

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
            await uploadVideo(file);
            prog[file] = 100;
            setProgressMap({ ...prog });
        }
        setRunning(false);
    };

    return (
        <div>
            <h3>{t('batch_upload')}</h3>
            <FilePicker multiple onSelect={handleSelect} label={t('select_videos')} filters={[{ name: 'Videos', extensions: ['mp4'] }]} />
            {files.length > 0 && <p>{t('files_selected', { count: files.length })}</p>}
            <button onClick={startUpload} disabled={running || !files.length}>{t('upload')}</button>
            {files.map(f => (
                <div key={f}>
                    <span>{f}</span>
                    {running && <progress value={progressMap[f] || 0} max={100} />}
                    {!running && progressMap[f] === 100 && <span>{t('done')}</span>}
                </div>
            ))}
        </div>
    );
};

export default BatchUploader;
