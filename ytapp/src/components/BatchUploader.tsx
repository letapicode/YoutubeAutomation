import React, { useState } from 'react';
import FilePicker from './FilePicker';
import { uploadVideo } from '../features/youtube';

const BatchUploader: React.FC = () => {
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
            <h3>Batch Upload</h3>
            <FilePicker multiple onSelect={handleSelect} label="Select Videos" filters={[{ name: 'Videos', extensions: ['mp4'] }]} />
            {files.length > 0 && <p>{files.length} files selected</p>}
            <button onClick={startUpload} disabled={running || !files.length}>Upload</button>
            {files.map(f => (
                <div key={f}>
                    <span>{f}</span>
                    {running && <progress value={progressMap[f] || 0} max={100} />}
                    {!running && progressMap[f] === 100 && <span>Done</span>}
                </div>
            ))}
        </div>
    );
};

export default BatchUploader;
