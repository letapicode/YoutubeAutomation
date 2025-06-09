import React from 'react';
import { useTranslation } from 'react-i18next';
import BatchProcessor from './BatchProcessor';
import BatchUploader from './BatchUploader';

const BatchPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h1>{t('batch_tools')}</h1>
            <BatchProcessor />
            <BatchUploader />
        </div>
    );
};

export default BatchPage;
