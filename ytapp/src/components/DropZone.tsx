// Simple wrapper around react-dropzone used by FilePicker.
import React from 'react';
import { useDropzone } from 'react-dropzone';

interface DropZoneProps {
    onDropFiles: (files: File[]) => void;
    acceptExt?: string[];
    multiple?: boolean;
    label?: string;
}

const DropZone: React.FC<DropZoneProps> = ({ onDropFiles, acceptExt, multiple = false, label }) => {
    const acceptObj = acceptExt
        ? acceptExt.reduce<Record<string, string[]>>((acc, ext) => {
              acc[ext.startsWith('.') ? ext : `.${ext}`] = [];
              return acc;
          }, {})
        : undefined;
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onDropFiles,
        multiple,
        accept: acceptObj,
    });

    return (
        <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            {isDragActive ? 'Drop files here...' : label || 'Drag & drop files here'}
        </div>
    );
};

export default DropZone;
