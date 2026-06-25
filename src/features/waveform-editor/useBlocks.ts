/**
 * Estado de los bloques marcados sobre las pistas (capability waveform-editor).
 *
 * Mantiene todos los bloques de todas las pistas; el editor filtra por la
 * pista activa. Los bloques son la fuente que luego alimenta el lienzo (#4).
 */

import { useState, useCallback } from 'react';
import { Block } from '@/types/model';

export interface BlocksActions {
  bloques: Block[];
  bloquesDePista(trackId: string): Block[];
  crearBloque(args: {
    trackId: string;
    etiqueta: string;
    inicioSeg: number;
    finSeg: number;
    color: string;
  }): Block;
  actualizarBloque(id: string, cambios: Partial<Omit<Block, 'id' | 'trackId'>>): void;
  eliminarBloque(id: string): void;
  /** Reemplaza todos los bloques (al cargar un proyecto guardado). */
  reemplazarBloques(bloques: Block[]): void;
}

export function useBlocks(): BlocksActions {
  const [bloques, setBloques] = useState<Block[]>([]);

  const bloquesDePista = useCallback(
    (trackId: string) => bloques.filter((b) => b.trackId === trackId),
    [bloques],
  );

  const crearBloque = useCallback<BlocksActions['crearBloque']>((args) => {
    const bloque: Block = { id: crypto.randomUUID(), ...args };
    setBloques((prev) => [...prev, bloque]);
    return bloque;
  }, []);

  const actualizarBloque = useCallback<BlocksActions['actualizarBloque']>((id, cambios) => {
    setBloques((prev) => prev.map((b) => (b.id === id ? { ...b, ...cambios } : b)));
  }, []);

  const eliminarBloque = useCallback((id: string) => {
    setBloques((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const reemplazarBloques = useCallback((nuevos: Block[]) => setBloques(nuevos), []);

  return {
    bloques,
    bloquesDePista,
    crearBloque,
    actualizarBloque,
    eliminarBloque,
    reemplazarBloques,
  };
}
