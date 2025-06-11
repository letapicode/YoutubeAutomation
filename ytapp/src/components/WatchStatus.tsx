// Display current watch state and allow toggling.
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { loadSettings } from '../features/settings';
import { watchDirectory } from '../features/watch';

const WatchStatus: React.FC = () => {
    const { t } = useTranslation();
    const [watching, setWatching] = useState(false);
    const [dir, setDir] = useState('');
    const [auto, setAuto] = useState(false);

    useEffect(() => {
        loadSettings().then(s => {
            setDir(s.watchDir || '');
            setAuto(!!s.autoUpload);
        });
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

    return (
        <div>
            <span>{watching ? t('watching') : t('not_watching')}</span>
            <button onClick={toggle}>
                {watching ? t('stop_watch') : t('start_watch')}
            </button>
        </div>
    );
};

export default WatchStatus;
