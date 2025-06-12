// Display current watch state and allow toggling.
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { loadSettings } from '../features/settings';
import { watchDirectory } from '../features/watch';
import { listJobs, runQueue } from '../features/queue';

const WatchStatus: React.FC = () => {
    const { t } = useTranslation();
    const [watching, setWatching] = useState(false);
    const [dir, setDir] = useState('');
    const [auto, setAuto] = useState(false);
    const [queueLen, setQueueLen] = useState(0);

    useEffect(() => {
        loadSettings().then(s => {
            setDir(s.watchDir || '');
            setAuto(!!s.autoUpload);
        });
        const interval = setInterval(() => {
            listJobs().then(j => setQueueLen(j.length));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggle = async () => {
        if (watching) {
            await watchDirectory('', { autoUpload: auto });
            setWatching(false);
        } else if (dir) {
            await watchDirectory(dir, { autoUpload: auto });
            setWatching(true);
        }
    };

    const process = async () => {
        await runQueue();
    };

    return (
        <div>
            <span>{watching ? t('watching') : t('not_watching')}</span>
            <button onClick={toggle}>
                {watching ? t('stop_watch') : t('start_watch')}
            </button>
            <span> {t('queue')}: {queueLen}</span>
            {!auto && <button onClick={process}>{t('process_queue')}</button>}
        </div>
    );
};

export default WatchStatus;
