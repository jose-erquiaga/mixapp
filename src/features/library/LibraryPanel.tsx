/**
 * Panel de biblioteca: drop zone + listado de pistas.
 */

import { useEffect } from 'react';
import { Track } from '@/types/model';
import { DropZone } from './DropZone';
import { TrackList } from './TrackList';
import { useLibrary } from './useLibrary';
import './LibraryPanel.css';

export interface LibraryPanelProps {
  onSelectTrack?: (track: Track) => void;
}

export function LibraryPanel({ onSelectTrack }: LibraryPanelProps) {
  const { pistas, importando, error, importarArchivos, actualizarBpm, eliminarPista, limpiarError } =
    useLibrary();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(limpiarError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, limpiarError]);

  return (
    <div className="library-panel">
      <div className="library-panel__section">
        <DropZone onFilesSelected={importarArchivos} disabled={importando} />
      </div>

      {error && (
        <div className="library-panel__error">
          <p>{error}</p>
          <button onClick={limpiarError} className="library-panel__error-close">
            ✕
          </button>
        </div>
      )}

      <div className="library-panel__section">
        <h3 className="library-panel__title">
          Pistas ({pistas.length})
        </h3>
        <TrackList
          pistas={pistas}
          onBpmChange={actualizarBpm}
          onDelete={eliminarPista}
          onSelect={onSelectTrack}
        />
      </div>
    </div>
  );
}
