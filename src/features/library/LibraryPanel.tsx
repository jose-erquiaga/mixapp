/**
 * Panel de biblioteca: drop zone + listado de pistas.
 * Presentacional: el estado vive en `useLibrary`, elevado a App.
 */

import { useEffect } from 'react';
import { Track } from '@/types/model';
import { DropZone } from './DropZone';
import { TrackList } from './TrackList';
import './LibraryPanel.css';

export interface LibraryPanelProps {
  pistas: Track[];
  importando: boolean;
  error: string | null;
  onImportar: (files: File[]) => void;
  onBpmChange: (trackId: string, bpm: number) => void;
  onEliminar: (trackId: string) => void;
  onLimpiarError: () => void;
  onSelectTrack?: (track: Track) => void;
  trackSeleccionadoId?: string;
}

export function LibraryPanel({
  pistas,
  importando,
  error,
  onImportar,
  onBpmChange,
  onEliminar,
  onLimpiarError,
  onSelectTrack,
}: LibraryPanelProps) {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(onLimpiarError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onLimpiarError]);

  return (
    <div className="library-panel">
      <div className="library-panel__section">
        <DropZone onFilesSelected={onImportar} disabled={importando} />
      </div>

      {error && (
        <div className="library-panel__error">
          <p>{error}</p>
          <button onClick={onLimpiarError} className="library-panel__error-close">
            ✕
          </button>
        </div>
      )}

      <div className="library-panel__section">
        <h3 className="library-panel__title">Pistas ({pistas.length})</h3>
        <TrackList
          pistas={pistas}
          onBpmChange={onBpmChange}
          onDelete={onEliminar}
          onSelect={onSelectTrack}
        />
      </div>
    </div>
  );
}
