/**
 * Zona de arrastrar archivos + selector, para importar pistas de audio.
 */

import { useRef, useState } from 'react';
import './DropZone.css';

export interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFilesSelected, disabled = false }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      /audio|video/.test(f.type),
    );
    if (files.length > 0) onFilesSelected(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(Array.from(e.target.files));
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      className={`drop-zone ${dragging ? 'drop-zone--dragging' : ''} ${disabled ? 'drop-zone--disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="drop-zone__content">
        <p className="drop-zone__text">
          Arrastra tus archivos de audio aquí
        </p>
        <p className="drop-zone__divider">o</p>
        <button
          className="drop-zone__button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          {disabled ? 'Importando...' : 'Selecciona archivos'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
