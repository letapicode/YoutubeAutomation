// Component responsible for generating multiple videos in sequence.
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilePicker from './FilePicker';
import { generateBatchWithProgress, BatchOptions } from '../features/batch';
import { generateBatchUpload, generateUpload } from '../features/youtube';
import { generateVideo } from '../features/processing';
import { invoke } from '@tauri-apps/api/core';
import BatchOptionsForm from './BatchOptionsForm';
import UploadIcon from './UploadIcon';
import { open } from '@tauri-apps/plugin-dialog';
import { parseCsv, CsvRow } from '../utils/csv';
import { notify } from '../utils/notify';

const BatchProcessor: React.FC = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [running, setRunning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState<BatchOptions>({});
  const [csvMap, setCsvMap] = useState<Record<string, CsvRow>>({});
  const [csvWarning, setCsvWarning] = useState(false);

  const handleSelect = (selected: string | string[] | null) => {
    if (Array.isArray(selected)) {
      setFiles(selected);
      setCsvWarning(selected.some(f => !csvMap[f]));
    } else if (typeof selected === 'string') {
      setFiles([selected]);
      setCsvWarning(!csvMap[selected]);
    } else {
      setFiles([]);
      setCsvWarning(false);
    }
  };

  const importCsv = async () => {
    const selected = await open({ filters: [{ name: 'CSV', extensions: ['csv'] }] });
    if (typeof selected === 'string') {
      const rows = await parseCsv(selected);
      const map: Record<string, CsvRow> = {};
      rows.forEach(r => { map[r.file] = r; });
      setCsvMap(map);
      setCsvWarning(files.some(f => !map[f]));
    }
  };

  const startBatch = async () => {
    if (!files.length) return;
    setRunning(true);
    setProgress(0);
    if (Object.keys(csvMap).length) {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const meta = csvMap[f] || {};
        await generateVideo({
          ...options,
          file: f,
          title: meta.title ?? options.title,
          description: meta.description ?? options.description,
          tags: meta.tags ?? options.tags,
          publishAt: meta.publishAt ?? options.publishAt,
        });
        const pct = Math.round(((i + 1) / files.length) * 100);
        setProgress(pct);
        setAnnouncement(`Generating... ${pct}%`);
      }
    } else {
      await generateBatchWithProgress(files, options, (cur, total) => {
        const pct = Math.round(((cur + 1) / total) * 100);
        setProgress(pct);
        setAnnouncement(`Generating... ${pct}%`);
      });
    }
    setRunning(false);
    setAnnouncement('');
    notify('Batch generate complete', `${files.length} video(s) processed`);
  };

  const cancelBatch = async () => {
    await invoke('cancel_generate');
    setRunning(false);
  };

  const startBatchUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setAnnouncement('Upload... 0%');
    if (Object.keys(csvMap).length) {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const meta = csvMap[f] || {};
        await generateUpload({
          ...options,
          file: f,
          title: meta.title ?? options.title,
          description: meta.description ?? options.description,
          tags: meta.tags ?? options.tags,
          publishAt: meta.publishAt ?? options.publishAt,
          thumbnail: options.thumbnail,
        });
        const pct = Math.round(((i + 1) / files.length) * 100);
        setProgress(pct);
        setAnnouncement(`Upload... ${pct}%`);
      }
    } else {
      await generateBatchUpload({ files, ...options });
      setProgress(100);
    }
    setUploading(false);
    setAnnouncement('');
    notify('Batch upload complete', `${files.length} video(s) uploaded`);
  };

  const cancelUpload = async () => {
    await invoke('cancel_upload');
    setUploading(false);
  };

  return (
    <div className="batch-processor">
      <h2>{t('batch_processor')}</h2>
      <div className="row">
        <FilePicker multiple useDropZone onSelect={handleSelect} label={t('select_audio_files')} />
        {files.length > 0 && <p>{t('files_selected', { count: files.length })}</p>}
      </div>
      <div className="row">
        <button onClick={importCsv}>{t('import_csv')}</button>
        {csvWarning && <span style={{ color: 'red' }}>{t('missing_in_csv')}</span>}
      </div>
      <BatchOptionsForm value={options} onChange={setOptions} />
      <div className="row">
        <button onClick={startBatch} disabled={running || !files.length}>{t('start')}</button>
        <button onClick={startBatchUpload} disabled={uploading || !files.length}>
          <UploadIcon />
          {t('generate_upload')}
        </button>
      </div>
      {running && (
        <div className="row">
          <progress value={progress} max={100} />
          <span>{progress}%</span>
          <button onClick={cancelBatch}>{t('cancel')}</button>
        </div>
      )}
      {uploading && (
        <div className="row">
          <progress value={progress} max={100} />
          <span>{progress}%</span>
          <button onClick={cancelUpload}>{t('cancel')}</button>
        </div>
      )}
      <div aria-live="polite" className="sr-only">{announcement}</div>
    </div>
  );
};

export default BatchProcessor;
