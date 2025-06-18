import React, { useEffect, useState, useRef } from 'react';
import { loadSrt, saveSrt } from '../features/transcription';

interface SubtitleEditorProps {
    file: string;
    onClose: () => void;
    onSaved: (path: string) => void;
}

const SubtitleEditor: React.FC<SubtitleEditorProps> = ({ file, onClose, onSaved }) => {
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [replace, setReplace] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        loadSrt(file)
            .then(setContent)
            .catch(e => setError(String(e)));
    }, [file]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    handleSave();
                } else if (e.key === 'f') {
                    e.preventDefault();
                    const input = document.getElementById('subtitle-search') as HTMLInputElement;
                    input?.focus();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    const handleSave = async () => {
        try {
            await saveSrt(file, content);
            onSaved(file);
        } catch (err: any) {
            setError(String(err));
        }
    };

    const handleReplace = (all: boolean) => {
        if (!search) return;
        const regex = new RegExp(search, 'g');
        setContent(c => all ? c.replace(regex, replace) : c.replace(search, replace));
    };

    return (
        <div>
            {error && <div>{error}</div>}
            <div className="row">
                <input id="subtitle-search" type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
                <input type="text" placeholder="Replace" value={replace} onChange={e => setReplace(e.target.value)} />
                <button onClick={() => handleReplace(false)}>Replace</button>
                <button onClick={() => handleReplace(true)}>Replace All</button>
            </div>
            <textarea
                ref={textareaRef}
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
