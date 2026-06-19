/**
 * Listado de bloques de una pista, con previsualización, edición de etiqueta
 * y borrado (tarea 3.5).
 */

import { useRef, useState } from 'react';
import { Block } from '@/types/model';
import { getTrackBuffer } from '@/audio/trackStore';
import { previsualizarRegion, type PreviewHandle } from '@/audio/preview';
import './BlockList.css';

export interface BlockListProps {
  bloques: Block[];
  fileRef: string;
  onActualizarEtiqueta: (id: string, etiqueta: string) => void;
  onEliminar: (id: string) => void;
}

function dur(b: Block): string {
  return `${(b.finSeg - b.inicioSeg).toFixed(1)}s`;
}

export function BlockList({ bloques, fileRef, onActualizarEtiqueta, onEliminar }: BlockListProps) {
  const [reproduciendo, setReproduciendo] = useState<string | null>(null);
  const handleRef = useRef<PreviewHandle | null>(null);

  const togglePreview = async (b: Block) => {
    // Si ya suena este bloque, parar.
    if (reproduciendo === b.id) {
      handleRef.current?.stop();
      handleRef.current = null;
      setReproduciendo(null);
      return;
    }
    handleRef.current?.stop();
    const buffer = getTrackBuffer(fileRef);
    if (!buffer) return;
    setReproduciendo(b.id);
    handleRef.current = await previsualizarRegion(buffer, b.inicioSeg, b.finSeg, () => {
      setReproduciendo(null);
      handleRef.current = null;
    });
  };

  if (bloques.length === 0) {
    return <p className="block-list__empty">Marca una región y crea tu primer bloque.</p>;
  }

  return (
    <ul className="block-list">
      {bloques.map((b) => (
        <li key={b.id} className="block-item" style={{ borderLeftColor: b.color }}>
          <button
            className="block-item__play"
            onClick={() => togglePreview(b)}
            aria-label={reproduciendo === b.id ? 'Detener' : 'Previsualizar'}
          >
            {reproduciendo === b.id ? '■' : '▶'}
          </button>
          <input
            className="block-item__etiqueta"
            value={b.etiqueta}
            onChange={(e) => onActualizarEtiqueta(b.id, e.target.value)}
          />
          <span className="block-item__dur">{dur(b)}</span>
          <button
            className="block-item__del"
            onClick={() => onEliminar(b.id)}
            aria-label="Eliminar bloque"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
