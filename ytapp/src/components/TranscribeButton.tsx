import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { transcribeAudio } from '../features/transcription';
import { Language } from '../features/language';

interface TranscribeButtonProps {
    file: string;
    language: Language;
    /**
     * Languages to translate the generated captions into.
     */
    targets: string[];
    onComplete: (srtPaths: string[]) => void;
}

const TranscribeButton: React.FC<TranscribeButtonProps> = ({ file, language, targets, onComplete }) => {
    const { t } = useTranslation();
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClick = async () => {
        if (!file) return;
        setRunning(true);
        setError(null);
        try {
            const result = await transcribeAudio({ file, language, translate: targets });
            onComplete(result);
        } catch (err: any) {
            setError(String(err));
        }
        setRunning(false);
    };

    return (
        <div className="row">
            <button onClick={handleClick} disabled={running || !file}>
                {running ? t('transcribing') : t('transcribe')}
            </button>
            {error && <span>{error}</span>}
        </div>
    );
};

export default TranscribeButton;
