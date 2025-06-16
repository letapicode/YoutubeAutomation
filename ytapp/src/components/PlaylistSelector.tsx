import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchPlaylists, Playlist } from '../features/youtube';

interface PlaylistSelectorProps {
    value: string;
    onChange: (id: string) => void;
}

const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    useEffect(() => {
        fetchPlaylists().then(setPlaylists).catch(() => setPlaylists([]));
    }, []);

    return (
        <select value={value} onChange={e => onChange(e.target.value)} aria-label={t('playlist')}>
            <option value="">{t('default')}</option>
            {playlists.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
            ))}
        </select>
    );
};

export default PlaylistSelector;
