import React from 'react';
import { open } from '@tauri-apps/api/dialog';

interface FilePickerProps {
  multiple?: boolean;
  onSelect: (paths: string | string[] | null) => void;
  label?: string;
}

const FilePicker: React.FC<FilePickerProps> = ({ multiple, onSelect, label }) => {
  const handleClick = async () => {
    const selected = await open({ multiple, filters: [
      { name: 'Audio', extensions: ['mp3', 'wav', 'm4a', 'flac', 'aac'] }
    ]});
    onSelect(selected);
  };

  return (
    <button onClick={handleClick}>{label || (multiple ? 'Select Files' : 'Select File')}</button>
  );
};

export default FilePicker;
