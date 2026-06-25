/**
 * Panel del lienzo de mezcla (capability mix-canvas).
 *
 * Móvil-first: los bloques se añaden tocando los chips de cada pista en la
 * biblioteca (incluida "Pista entera"), no arrastrando, y se reordenan con
 * flechas. Entre cada par de bloques hay un selector de transición. Cada bloque
 * hereda el color de su canción (tarea 4.4).
 */

import { Block, Track, SequencedBlock, Transition } from '@/types/model';
import { TransitionSelector } from './TransitionSelector';
import './MixCanvasPanel.css';

export interface MixCanvasPanelProps {
  tracks: Track[];
  secuencia: SequencedBlock[];
  onQuitar: (index: number) => void;
  onMover: (index: number, direccion: -1 | 1) => void;
  onCambiarTransicion: (index: number, t: Transition) => void;
}

function dur(b: Block): string {
  return `${(b.finSeg - b.inicioSeg).toFixed(1)}s`;
}

export function MixCanvasPanel({
  tracks,
  secuencia,
  onQuitar,
  onMover,
  onCambiarTransicion,
}: MixCanvasPanelProps) {
  const bpmDePista = (trackId: string) => tracks.find((t) => t.id === trackId)?.bpm ?? 120;

  return (
    <div className="mix-canvas">
      {/* Secuencia */}
      <div className="mix-canvas__sec-wrap">
        <h3 className="mix-canvas__sub">Secuencia ({secuencia.length})</h3>
        {secuencia.length === 0 ? (
          <p className="mix-canvas__vacio">Añade bloques para empezar la mezcla.</p>
        ) : (
          <div className="mix-canvas__secuencia">
            {secuencia.map((sb, i) => (
              <div key={`${sb.block.id}-${i}`} className="mix-canvas__nodo">
                <div className="mix-canvas__bloque" style={{ borderTopColor: sb.block.color }}>
                  <div className="mix-canvas__bloque-head">
                    <span className="mix-canvas__dot" style={{ background: sb.block.color }} />
                    <span className="mix-canvas__etiqueta">{sb.block.etiqueta}</span>
                  </div>
                  <span className="mix-canvas__dur">{dur(sb.block)}</span>
                  <div className="mix-canvas__acciones">
                    <button onClick={() => onMover(i, -1)} disabled={i === 0} aria-label="Mover izquierda">
                      ←
                    </button>
                    <button
                      onClick={() => onMover(i, 1)}
                      disabled={i === secuencia.length - 1}
                      aria-label="Mover derecha"
                    >
                      →
                    </button>
                    <button onClick={() => onQuitar(i)} aria-label="Quitar" className="mix-canvas__quitar">
                      ✕
                    </button>
                  </div>
                </div>

                {/* Transición hacia el siguiente bloque */}
                {i < secuencia.length - 1 && (
                  <div className="mix-canvas__transicion">
                    <TransitionSelector
                      transicion={sb.transitionSaliente}
                      bpmSaliente={bpmDePista(sb.block.trackId)}
                      bpmEntrante={bpmDePista(secuencia[i + 1].block.trackId)}
                      onChange={(t) => onCambiarTransicion(i, t)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
