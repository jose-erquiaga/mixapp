/**
 * Estado de la secuencia del lienzo de mezcla (capability mix-canvas).
 *
 * La secuencia es una lista ordenada de bloques, cada uno con la transición
 * que lo une al siguiente (la del último se ignora). Móvil-first: se añade,
 * reordena y quita con controles explícitos, no con drag-and-drop.
 */

import { useState, useCallback } from 'react';
import { Block, SequencedBlock, Transition, TRANSICION_POR_DEFECTO } from '@/types/model';

export interface MixCanvasActions {
  secuencia: SequencedBlock[];
  anadirBloque(block: Block): void;
  quitarEnIndice(index: number): void;
  moverBloque(index: number, direccion: -1 | 1): void;
  cambiarTransicion(index: number, transicion: Transition): void;
  /** Reemplaza la secuencia completa (al cargar un proyecto guardado). */
  reemplazarSecuencia(secuencia: SequencedBlock[]): void;
}

export function useMixCanvas(): MixCanvasActions {
  const [secuencia, setSecuencia] = useState<SequencedBlock[]>([]);

  const anadirBloque = useCallback((block: Block) => {
    setSecuencia((prev) => [...prev, { block, transitionSaliente: { ...TRANSICION_POR_DEFECTO } }]);
  }, []);

  const quitarEnIndice = useCallback((index: number) => {
    setSecuencia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moverBloque = useCallback((index: number, direccion: -1 | 1) => {
    setSecuencia((prev) => {
      const destino = index + direccion;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[index], copia[destino]] = [copia[destino], copia[index]];
      return copia;
    });
  }, []);

  const cambiarTransicion = useCallback((index: number, transicion: Transition) => {
    setSecuencia((prev) =>
      prev.map((sb, i) => (i === index ? { ...sb, transitionSaliente: transicion } : sb)),
    );
  }, []);

  const reemplazarSecuencia = useCallback((nueva: SequencedBlock[]) => setSecuencia(nueva), []);

  return {
    secuencia,
    anadirBloque,
    quitarEnIndice,
    moverBloque,
    cambiarTransicion,
    reemplazarSecuencia,
  };
}
