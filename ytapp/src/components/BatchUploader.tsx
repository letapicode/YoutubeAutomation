import React, { useState } from 'react';
import FilePicker from './FilePicker';
import { uploadVideos } from '../features/youtube';

const BatchUploader: React.FC = () => {
    const [files, setFiles] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [running, setRunning] = useState(false);

    const handleSelect = (p: string | string[] | null) => {
        if (Array.isArray(p)) setFiles(p);
        else if (typeof p === 'string') setFiles([p]);
    };

    const startUpload = async () => {
        if (!files.length) return;
        setRunning(true);
        setProgress(0);
        const res = await uploadVideos(files);
        console.log(res);
        setProgress(100);
        setRunning(false);
    };

    return (
        <div>
            <h3>Batch Upload</h3>
            <FilePicker multiple onSelect={handleSelect} label="Select Videos" filters={[{ name: 'Videos', extensions: ['mp4'] }]} />
            {files.length > 0 && <p>{files.length} files selected</p>}
            <button onClick={startUpload} disabled={running || !files.length}>Upload</button>
            {running && <progress value={progress} max={100} />}
        </div>
    );
};

export default BatchUploader;
