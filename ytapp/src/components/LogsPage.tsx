import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLogs, clearLogs } from '../features/logs';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

const LogsPage: React.FC = () => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [level, setLevel] = useState('');
    const [search, setSearch] = useState('');

    const refresh = () => {
        getLogs(200, level || undefined, search || undefined)
            .then(setText)
            .catch(() => setText(''));
    };

    const saveLogs = async () => {
        const path = await save({ filters: [{ name: 'Log', extensions: ['log'] }] });
        if (path) {
            const data = await getLogs(1000, level || undefined, search || undefined);
            await writeTextFile(path, data);
        }
    };

    const doClear = async () => {
        await clearLogs();
        setText('');
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <div>
            <input
                placeholder="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
            />
            <input
                placeholder="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={refresh}>{t('refresh')}</button>
            <button onClick={saveLogs}>{t('save_logs')}</button>
            <button onClick={doClear}>{t('clear_logs')}</button>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '70vh', overflow: 'auto' }}>{text}</pre>
        </div>
    );
};

export default LogsPage;
