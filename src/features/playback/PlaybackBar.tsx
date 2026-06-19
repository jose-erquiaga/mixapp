/**
 * Barra de transporte de la mezcla (tarea 5.3): play/pause, cabezal en
 * movimiento sobre una barra de progreso, y marcadores para saltar a cada
 * bloque tocándolos.
 */

import { SequencedBlock } from '@/types/model';
import './PlaybackBar.css';

export interface PlaybackBarProps {
  secuencia: SequencedBlock[];
  posSeg: number;
  totalSeg: number;
  reproduciendo: boolean;
  iniciosBloque: number[];
  onPlay: () => void;
  onPause: () => void;
  onSaltar: (index: number) => void;
}

function mmss(seg: number): string {
  if (!isFinite(seg)) seg = 0;
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlaybackBar({
  secuencia,
  posSeg,
  totalSeg,
  reproduciendo,
  iniciosBloque,
  onPlay,
  onPause,
  onSaltar,
}: PlaybackBarProps) {
  const vacio = secuencia.length === 0 || totalSeg <= 0;
  const pct = totalSeg > 0 ? Math.min(100, (posSeg / totalSeg) * 100) : 0;

  return (
    <div className="playbar">
      <button
        className="playbar__play"
        onClick={reproduciendo ? onPause : onPlay}
        disabled={vacio}
        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
      >
        {reproduciendo ? '⏸' : '▶'}
      </button>

      <span className="playbar__tiempo">{mmss(posSeg)}</span>

      {vacio ? (
        <div className="playbar__hint">
          Crea bloques en el editor y pulsa «Añadir» para armar la secuencia y reproducir.
        </div>
      ) : (
        <div className="playbar__pista">
          {/* Marcadores de bloque (saltar tocando) */}
          {iniciosBloque.map((ini, i) => (
            <button
              key={i}
              className="playbar__marca"
              style={{
                left: `${totalSeg > 0 ? (ini / totalSeg) * 100 : 0}%`,
                background: secuencia[i]?.block.color,
              }}
              onClick={() => onSaltar(i)}
              aria-label={`Saltar a ${secuencia[i]?.block.etiqueta ?? 'bloque'}`}
              title={secuencia[i]?.block.etiqueta}
            />
          ))}
          {/* Progreso + cabezal */}
          <div className="playbar__progreso" style={{ width: `${pct}%` }} />
          <div className="playbar__cabezal" style={{ left: `${pct}%` }} />
        </div>
      )}

      <span className="playbar__tiempo">{mmss(totalSeg)}</span>
    </div>
  );
}
