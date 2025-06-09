import React from 'react';
import { open } from '@tauri-apps/api/dialog';

interface FileFilter {
  name: string;
  extensions: string[];
}

interface FilePickerProps {
  multiple?: boolean;
  onSelect: (paths: string | string[] | null) => void;
  label?: string;
  filters?: FileFilter[];
}

const FilePicker: React.FC<FilePickerProps> = ({ multiple, onSelect, label, filters }) => {
  const handleClick = async () => {
    const defaultFilters: FileFilter[] = [
      { name: 'Audio', extensions: ['mp3', 'wav', 'm4a', 'flac', 'aac'] },
    ];
    const selected = await open({
      multiple,
      filters: filters && filters.length ? filters : defaultFilters,
    });
    onSelect(selected);
  };

  return (
    <button onClick={handleClick}>{label || (multiple ? 'Select Files' : 'Select File')}</button>
  );
};

export default FilePicker;
