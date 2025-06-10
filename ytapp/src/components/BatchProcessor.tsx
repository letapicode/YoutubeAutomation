import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilePicker from './FilePicker';
import { generateBatchWithProgress, BatchOptions } from '../features/batch';
import { generateBatchUpload } from '../features/youtube';
import BatchOptionsForm from './BatchOptionsForm';
import Collapsible from './Collapsible';
import { UploadIcon } from '../icons';

const BatchProcessor: React.FC = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState<BatchOptions>({});

  const handleSelect = (selected: string | string[] | null) => {
    if (Array.isArray(selected)) {
      setFiles(selected);
    } else if (typeof selected === 'string') {
      setFiles([selected]);
    } else {
      setFiles([]);
    }
  };

  const startBatch = async () => {
    if (!files.length) return;
    setRunning(true);
    setProgress(0);
    await generateBatchWithProgress(files, options, (cur, total) => {
      const pct = Math.round(((cur + 1) / total) * 100);
      setProgress(pct);
    });
    setRunning(false);
  };

  const startBatchUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    await generateBatchUpload({ files, ...options });
    setUploading(false);
  };

  return (
    <div className="grid">
      <h2>{t('batch_processor')}</h2>
      <div className="row">
        <FilePicker multiple useDropZone onSelect={handleSelect} label={t('select_audio_files')} />
        {files.length > 0 && <span>{t('files_selected', { count: files.length })}</span>}
      </div>
      <Collapsible title={t('options')}>
        <BatchOptionsForm value={options} onChange={setOptions} />
      </Collapsible>
      <div className="row">
        <button onClick={startBatch} disabled={running || !files.length}>{t('start')}</button>
        <button onClick={startBatchUpload} disabled={uploading || !files.length}>
          <UploadIcon /> {t('generate_upload')}
        </button>
      </div>
      {running && (
        <div className="row">
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
