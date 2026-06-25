/**
 * Hook que conecta el workspace con el catálogo persistente (issue #10).
 *
 * Expone:
 *  - `guardarEnBiblioteca()`: persiste las canciones del workspace + sus bloques.
 *  - `eliminarDeBiblioteca(id)`: borra una canción del catálogo.
 *  - Estado: `ocupado`, `estado` (texto de feedback), `hayBiblioteca`.
 */

import { useState, useEffect, useCallback } from 'react';
import { Track, Block } from '@/types/model';
import { getTrackFile } from '@/audio/trackStore';
import {
  guardarCanciones,
  eliminarCancion,
  hayCancionesGuardadas,
  CancionGuardada,
} from './libraryStore';

export interface LocalLibraryOpts {
  pistas: Track[];
  bloques: Block[];
}

export interface LocalLibraryState {
  ocupado: boolean;
  estado: string | null;
  hayBiblioteca: boolean;
}

export interface LocalLibraryActions {
  guardarEnBiblioteca(): Promise<void>;
  eliminarDeBiblioteca(id: string): Promise<void>;
}

export function useLocalLibrary(
  opts: LocalLibraryOpts,
): LocalLibraryState & LocalLibraryActions {
  const { pistas, bloques } = opts;
  const [ocupado, setOcupado] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [hayBiblioteca, setHayBiblioteca] = useState(false);

  useEffect(() => {
    hayCancionesGuardadas().then(setHayBiblioteca).catch(() => {});
  }, []);

  const guardarEnBiblioteca = useCallback(async () => {
    if (pistas.length === 0) return;
    setOcupado(true);
    setEstado('Guardando en biblioteca…');
    try {
      const ahora = Date.now();
      const canciones: CancionGuardada[] = [];
      for (const p of pistas) {
        const file = getTrackFile(p.fileRef);
        if (!file) continue;
        canciones.push({
          id: p.id,
          nombre: p.nombre,
          bpm: p.bpm,
          sampleRate: p.sampleRate,
          duracionSeg: p.duracionSeg,
          file,
          bloques: bloques.filter((b) => b.trackId === p.id),
          guardadoEn: ahora,
        });
      }
      await guardarCanciones(canciones);
      setHayBiblioteca(true);
      setEstado(`${canciones.length} canción(es) guardada(s)`);
    } catch (err) {
      setEstado(
        `Error: ${err instanceof Error ? err.message : 'desconocido'}`,
      );
    } finally {
      setOcupado(false);
    }
  }, [pistas, bloques]);

  const eliminarDeBiblioteca = useCallback(async (id: string) => {
    setOcupado(true);
    try {
      await eliminarCancion(id);
      const quedan = await hayCancionesGuardadas();
      setHayBiblioteca(quedan);
      setEstado('Canción eliminada de la biblioteca');
    } catch (err) {
      setEstado(
        `Error: ${err instanceof Error ? err.message : 'desconocido'}`,
      );
    } finally {
      setOcupado(false);
    }
  }, []);

  return { ocupado, estado, hayBiblioteca, guardarEnBiblioteca, eliminarDeBiblioteca };
}
