/**
 * Listado de pistas importadas con opción de editar BPM y eliminar.
 */

import { Track } from '@/types/model';
import './TrackList.css';

export interface TrackListProps {
  pistas: Track[];
  onBpmChange: (trackId: string, bpm: number) => void;
  onDelete: (trackId: string) => void;
  onSelect?: (track: Track) => void;
}

function formatTiempo(seg: number): string {
  const min = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${min}:${s.toString().padStart(2, '0')}`;
}

export function TrackList({
  pistas,
  onBpmChange,
  onDelete,
  onSelect,
}: TrackListProps) {
  if (pistas.length === 0) {
    return (
      <div className="track-list-empty">
        <p>Ninguna pista importada aún.</p>
      </div>
    );
  }

  return (
    <div className="track-list">
      {pistas.map((pista) => (
        <div
          key={pista.id}
          className="track-item"
          onClick={() => onSelect?.(pista)}
        >
          <div className="track-item__info">
            <h3 className="track-item__nombre">{pista.nombre}</h3>
            <p className="track-item__meta">
              {formatTiempo(pista.duracionSeg)} • {pista.sampleRate / 1000}kHz
            </p>
          </div>

          <div className="track-item__controls">
            <div className="track-item__bpm-control">
              <label htmlFor={`bpm-${pista.id}`} className="track-item__label">
                BPM
              </label>
              <input
                id={`bpm-${pista.id}`}
                type="number"
                min="40"
                max="240"
                value={pista.bpm}
                onChange={(e) =>
                  onBpmChange(pista.id, parseInt(e.target.value) || pista.bpm)
                }
                className="track-item__input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <button
              className="track-item__delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(pista.id);
              }}
              aria-label="Eliminar pista"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
