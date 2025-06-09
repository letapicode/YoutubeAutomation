import React from 'react';
import BatchProcessor from './BatchProcessor';
import BatchUploader from './BatchUploader';

const BatchPage: React.FC = () => (
    <div>
        <h1>Batch Tools</h1>
        <BatchProcessor />
        <BatchUploader />
    </div>
);

export default BatchPage;
