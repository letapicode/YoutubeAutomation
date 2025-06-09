import React, { useState } from 'react';
import FilePicker from './FilePicker';
import { generateBatchWithProgress } from '../features/batch';

const BatchProcessor: React.FC = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

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
    await generateBatchWithProgress(files, {}, (cur, total) => {
      const pct = Math.round(((cur + 1) / total) * 100);
      setProgress(pct);
    });
    setRunning(false);
  };

  return (
    <div>
      <h2>Batch Processor</h2>
      <FilePicker multiple onSelect={handleSelect} label="Select Audio Files" />
      {files.length > 0 && <p>{files.length} files selected</p>}
      <button onClick={startBatch} disabled={running || !files.length}>Start</button>
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
