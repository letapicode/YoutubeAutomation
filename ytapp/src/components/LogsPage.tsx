import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLogs } from '../features/logs';

const LogsPage: React.FC = () => {
    const { t } = useTranslation();
    const [text, setText] = useState('');

    const refresh = () => {
        getLogs(200).then(setText).catch(() => setText(''));
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <div>
            <button onClick={refresh}>{t('refresh')}</button>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '70vh', overflow: 'auto' }}>{text}</pre>
        </div>
    );
};

export default LogsPage;
