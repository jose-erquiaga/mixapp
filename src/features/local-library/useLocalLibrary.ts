/**
 * Hook que conecta el workspace con el catálogo persistente (issues #10-#12).
 *
 * Expone:
 *  - `guardarEnBiblioteca()`: persiste las canciones del workspace + sus bloques.
 *  - `cargarDesdeBiblioteca(cancion)`: trae canción + bloques al workspace.
 *  - `eliminarDeBiblioteca(id)`: borra una canción del catálogo.
 *  - Estado: `ocupado`, `estado`, `hayBiblioteca`, `modalAbierto`.
 */

import { useState, useEffect, useCallback } from 'react';
import { Track, Block } from '@/types/model';
import { decodificarArchivo } from '@/audio/decode';
import { getTrackFile, putTrackAudio } from '@/audio/trackStore';
import {
  guardarCanciones,
  eliminarCancion,
  hayCancionesGuardadas,
  CancionGuardada,
} from './libraryStore';

export interface LocalLibraryOpts {
  pistas: Track[];
  bloques: Block[];
  onAnadirPista: (pista: Track) => void;
  onMergeBloques: (bloques: Block[]) => void;
}

export interface LocalLibraryState {
  ocupado: boolean;
  estado: string | null;
  hayBiblioteca: boolean;
  modalAbierto: boolean;
}

export interface LocalLibraryActions {
  guardarEnBiblioteca(): Promise<void>;
  cargarDesdeBiblioteca(cancion: CancionGuardada): Promise<void>;
  eliminarDeBiblioteca(id: string): Promise<void>;
  abrirModal(): void;
  cerrarModal(): void;
}

export function useLocalLibrary(
  opts: LocalLibraryOpts,
): LocalLibraryState & LocalLibraryActions {
  const { pistas, bloques, onAnadirPista, onMergeBloques } = opts;
  const [ocupado, setOcupado] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [hayBiblioteca, setHayBiblioteca] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

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

  const cargarDesdeBiblioteca = useCallback(
    async (cancion: CancionGuardada) => {
      if (pistas.some((p) => p.id === cancion.id)) {
        setEstado(`"${cancion.nombre}" ya está en el workspace`);
        return;
      }
      setOcupado(true);
      setEstado(`Cargando "${cancion.nombre}"…`);
      try {
        const buffer = await decodificarArchivo(cancion.file);
        putTrackAudio(cancion.id, cancion.file, buffer);

        const pista: Track = {
          id: cancion.id,
          nombre: cancion.nombre,
          fileRef: cancion.id,
          sampleRate: cancion.sampleRate,
          duracionSeg: cancion.duracionSeg,
          bpm: cancion.bpm,
        };
        onAnadirPista(pista);

        if (cancion.bloques.length > 0) {
          onMergeBloques(cancion.bloques);
        }

        setEstado(`"${cancion.nombre}" cargada con ${cancion.bloques.length} bloque(s)`);
      } catch (err) {
        setEstado(
          `Error cargando: ${err instanceof Error ? err.message : 'desconocido'}`,
        );
      } finally {
        setOcupado(false);
      }
    },
    [pistas, onAnadirPista, onMergeBloques],
  );

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

  const abrirModal = useCallback(() => setModalAbierto(true), []);
  const cerrarModal = useCallback(() => setModalAbierto(false), []);

  return {
    ocupado,
    estado,
    hayBiblioteca,
    modalAbierto,
    guardarEnBiblioteca,
    cargarDesdeBiblioteca,
    eliminarDeBiblioteca,
    abrirModal,
    cerrarModal,
  };
}
