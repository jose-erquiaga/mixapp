/**
 * Listado de pistas importadas con opción de editar BPM y eliminar.
 */

import { Track, Block } from '@/types/model';
import { colorParaPista } from '@/util/color';
import './TrackList.css';

export interface TrackListProps {
  pistas: Track[];
  onBpmChange: (trackId: string, bpm: number) => void;
  onDelete: (trackId: string) => void;
  onSelect?: (track: Track) => void;
  /** Bloques marcados de una pista, para mostrarlos dentro de su tarjeta. */
  bloquesDePista?: (trackId: string) => Block[];
  /** Añade un bloque a la secuencia del lienzo (mismo handler que el lienzo). */
  onAnadirBloque?: (block: Block) => void;
}

function formatTiempo(seg: number): string {
  const min = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${min}:${s.toString().padStart(2, '0')}`;
}

function durBloque(b: Block): string {
  return `${(b.finSeg - b.inicioSeg).toFixed(1)}s`;
}

/** Bloque sintético que cubre la pista completa (0 … duracionSeg). */
function bloqueDePistaEntera(pista: Track): Block {
  return {
    id: `pista-${pista.id}`,
    trackId: pista.id,
    etiqueta: pista.nombre,
    inicioSeg: 0,
    finSeg: pista.duracionSeg,
    color: colorParaPista(pista.id),
  };
}

export function TrackList({
  pistas,
  onBpmChange,
  onDelete,
  onSelect,
  bloquesDePista,
  onAnadirBloque,
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
      {pistas.map((pista) => {
        const bloques = bloquesDePista?.(pista.id) ?? [];
        return (
          <div
            key={pista.id}
            className="track-item"
            onClick={() => onSelect?.(pista)}
          >
            <div className="track-item__top">
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

            {onAnadirBloque && (
              <div className="track-item__acciones">
                <button
                  className="track-item__pista-entera"
                  style={{ borderColor: colorParaPista(pista.id) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAnadirBloque(bloqueDePistaEntera(pista));
                  }}
                  title="Añadir la pista entera a la secuencia"
                >
                  <span className="track-item__bloque-plus">＋</span> Pista entera
                </button>

                {bloques.map((b) => (
                  <button
                    key={b.id}
                    className="track-item__bloque-chip"
                    style={{ borderColor: b.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnadirBloque(b);
                    }}
                    title={`Añadir "${b.etiqueta}" a la secuencia`}
                  >
                    <span
                      className="track-item__bloque-dot"
                      style={{ background: b.color }}
                    />
                    {b.etiqueta} <small>{durBloque(b)}</small>
                    <span className="track-item__bloque-plus">＋</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
