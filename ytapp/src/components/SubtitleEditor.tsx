import React, { useEffect, useState } from 'react';
import { loadSrt, saveSrt } from '../features/transcription';

interface SubtitleEditorProps {
    file: string;
    onClose: () => void;
    onSaved: (path: string) => void;
}

const SubtitleEditor: React.FC<SubtitleEditorProps> = ({ file, onClose, onSaved }) => {
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSrt(file)
            .then(setContent)
            .catch(e => setError(String(e)));
    }, [file]);

    const handleSave = async () => {
        try {
            await saveSrt(file, content);
            onSaved(file);
        } catch (err: any) {
            setError(String(err));
        }
    };

    return (
        <div>
            {error && <div>{error}</div>}
            <textarea
                style={{ width: '100%', height: '60vh' }}
                value={content}
                onChange={e => setContent(e.target.value)}
            />
            <div className="row">
                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default SubtitleEditor;
