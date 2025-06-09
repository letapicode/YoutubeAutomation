import React, { useState } from 'react';
import FilePicker from './FilePicker';
import { generateBatchWithProgress, BatchOptions } from '../features/batch';
import { generateBatchUpload } from '../features/youtube';
import BatchOptionsForm from './BatchOptionsForm';

const BatchProcessor: React.FC = () => {
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
    <div>
      <h2>Batch Processor</h2>
      <FilePicker multiple onSelect={handleSelect} label="Select Audio Files" />
      {files.length > 0 && <p>{files.length} files selected</p>}
      <BatchOptionsForm value={options} onChange={setOptions} />
      <button onClick={startBatch} disabled={running || !files.length}>Start</button>
      <button onClick={startBatchUpload} disabled={uploading || !files.length}>Generate &amp; Upload</button>
      {running && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
