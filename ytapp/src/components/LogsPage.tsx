import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLogs } from '../features/logs';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

const LogsPage: React.FC = () => {
    const { t } = useTranslation();
    const [text, setText] = useState('');

    const refresh = () => {
        getLogs(200).then(setText).catch(() => setText(''));
    };

    const saveLogs = async () => {
        const path = await save({ filters: [{ name: 'Log', extensions: ['log'] }] });
        if (path) {
            const data = await getLogs(1000);
            await writeTextFile(path, data);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <div>
            <button onClick={refresh}>{t('refresh')}</button>
            <button onClick={saveLogs}>{t('save_logs')}</button>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '70vh', overflow: 'auto' }}>{text}</pre>
        </div>
    );
};

export default LogsPage;
