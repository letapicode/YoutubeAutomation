// Button/DropZone component for selecting files from the filesystem.
import React from 'react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import DropZone from './DropZone';

interface FileFilter {
  name: string;
  extensions: string[];
}

interface FilePickerProps {
  multiple?: boolean;
  onSelect: (paths: string | string[] | null) => void;
  label?: string;
  filters?: FileFilter[];
  useDropZone?: boolean;
}

const FilePicker: React.FC<FilePickerProps> = ({ multiple, onSelect, label, filters, useDropZone }) => {
  const { t } = useTranslation();
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

  const handleDrop = (files: File[]) => {
    const paths = files.map(f => (f as any).path || f.name);
    if (multiple) onSelect(paths);
    else onSelect(paths[0] || null);
  };

  const exts = (filters && filters.length
    ? filters
    : [{ name: 'Audio', extensions: ['mp3', 'wav', 'm4a', 'flac', 'aac'] }]
  ).flatMap(f => f.extensions);

  if (useDropZone) {
    return (
      <DropZone
        onDropFiles={handleDrop}
        acceptExt={exts}
        multiple={multiple}
        label={label || (multiple ? t('select_files') : t('select_file'))}
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={label || (multiple ? t('select_files') : t('select_file'))}
    >
      {label || (multiple ? t('select_files') : t('select_file'))}
    </button>
  );
};

export default FilePicker;
