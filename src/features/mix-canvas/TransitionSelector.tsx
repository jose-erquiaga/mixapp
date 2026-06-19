/**
 * Selector de transición entre dos bloques consecutivos (tarea 4.3).
 * Tipos: corte, crossfade (con duración) y ajuste de BPM (con aviso si la
 * diferencia entre bloques es grande).
 */

import { Transition, TransitionType } from '@/types/model';

export interface TransitionSelectorProps {
  transicion: Transition;
  /** BPM del bloque saliente y del entrante, para avisar en ajuste de BPM. */
  bpmSaliente: number;
  bpmEntrante: number;
  onChange: (t: Transition) => void;
}

/** Umbral de diferencia de BPM a partir del cual avisamos de pérdida de calidad. */
const UMBRAL_AVISO_BPM = 0.15; // 15%

export function TransitionSelector({
  transicion,
  bpmSaliente,
  bpmEntrante,
  onChange,
}: TransitionSelectorProps) {
  const setTipo = (tipo: TransitionType) => {
    if (tipo === 'crossfade') onChange({ tipo, duracionSeg: transicion.duracionSeg ?? 2 });
    else if (tipo === 'bpm-match') onChange({ tipo, bpmObjetivo: transicion.bpmObjetivo ?? bpmEntrante });
    else onChange({ tipo });
  };

  const diff = Math.abs(bpmSaliente - bpmEntrante) / Math.max(bpmSaliente, 1);
  const avisoBpm = transicion.tipo === 'bpm-match' && diff > UMBRAL_AVISO_BPM;

  return (
    <div className="transicion">
      <div className="transicion__tipos">
        <button
          className={transicion.tipo === 'cut' ? 'is-activa' : ''}
          onClick={() => setTipo('cut')}
        >
          Corte
        </button>
        <button
          className={transicion.tipo === 'crossfade' ? 'is-activa' : ''}
          onClick={() => setTipo('crossfade')}
        >
          Crossfade
        </button>
        <button
          className={transicion.tipo === 'bpm-match' ? 'is-activa' : ''}
          onClick={() => setTipo('bpm-match')}
        >
          Ajuste BPM
        </button>
      </div>

      {transicion.tipo === 'crossfade' && (
        <label className="transicion__param">
          Duración
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.5"
            value={transicion.duracionSeg ?? 2}
            onChange={(e) =>
              onChange({ tipo: 'crossfade', duracionSeg: parseFloat(e.target.value) || 2 })
            }
          />
          s
        </label>
      )}

      {transicion.tipo === 'bpm-match' && (
        <label className="transicion__param">
          BPM objetivo
          <input
            type="number"
            min="40"
            max="240"
            value={transicion.bpmObjetivo ?? bpmEntrante}
            onChange={(e) =>
              onChange({ tipo: 'bpm-match', bpmObjetivo: parseInt(e.target.value) || bpmEntrante })
            }
          />
        </label>
      )}

      {avisoBpm && (
        <p className="transicion__aviso">
          ⚠ Diferencia de BPM grande ({Math.round(bpmSaliente)}→{Math.round(bpmEntrante)}): puede
          degradar la calidad.
        </p>
      )}
    </div>
  );
}
