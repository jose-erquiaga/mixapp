/**
 * Hook de persistencia y exportación (capability project-persistence).
 *
 * Orquesta:
 *  - Guardar/cargar el proyecto en IndexedDB (6.1), re-decodificando los audios
 *    al cargar para repoblar el trackStore.
 *  - Exportar la mezcla: render offline (6.2) + codificación WAV y descarga (6.3).
 */

import { useCallback, useEffect, useState } from 'react';
import { Track, Block, SequencedBlock } from '@/types/model';
import { decodificarArchivo } from '@/audio/decode';
import { putTrackAudio, getTrackFile } from '@/audio/trackStore';
import { renderMixToBuffer, type PlanMezcla } from '@/audio/mixPlayer';
import { audioBufferToWav } from '@/audio/wav';
import {
  guardarProyecto,
  cargarProyecto,
  hayProyectoGuardado,
  type ProjectSnapshot,
} from './projectStore';

const NOMBRE_PROYECTO = 'Mi mezcla';

export interface PersistenceDeps {
  pistas: Track[];
  bloques: Block[];
  secuencia: SequencedBlock[];
  plan: PlanMezcla;
  reemplazarPistas: (pistas: Track[]) => void;
  reemplazarBloques: (bloques: Block[]) => void;
  reemplazarSecuencia: (secuencia: SequencedBlock[]) => void;
}

export interface PersistenceState {
  ocupado: boolean;
  estado: string | null;
  hayGuardado: boolean;
  guardar: () => Promise<void>;
  cargar: () => Promise<void>;
  exportarWav: () => Promise<void>;
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function usePersistence(deps: PersistenceDeps): PersistenceState {
  const {
    pistas,
    bloques,
    secuencia,
    plan,
    reemplazarPistas,
    reemplazarBloques,
    reemplazarSecuencia,
  } = deps;

  const [ocupado, setOcupado] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [hayGuardado, setHayGuardado] = useState(false);

  useEffect(() => {
    hayProyectoGuardado()
      .then(setHayGuardado)
      .catch(() => setHayGuardado(false));
  }, []);

  const guardar = useCallback(async () => {
    if (pistas.length === 0) {
      setEstado('No hay nada que guardar todavía.');
      return;
    }
    setOcupado(true);
    setEstado('Guardando…');
    try {
      const archivos: Record<string, File> = {};
      for (const pista of pistas) {
        const file = getTrackFile(pista.fileRef);
        if (file) archivos[pista.fileRef] = file;
      }
      const snapshot: ProjectSnapshot = {
        id: 'actual',
        nombre: NOMBRE_PROYECTO,
        version: 1,
        guardadoEn: Date.now(),
        tracks: pistas,
        bloques,
        secuencia,
      };
      await guardarProyecto(snapshot, archivos);
      setHayGuardado(true);
      setEstado('Proyecto guardado ✓');
    } catch (err) {
      setEstado(`Error al guardar: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setOcupado(false);
    }
  }, [pistas, bloques, secuencia]);

  const cargar = useCallback(async () => {
    setOcupado(true);
    setEstado('Cargando…');
    try {
      const datos = await cargarProyecto();
      if (!datos) {
        setEstado('No hay ningún proyecto guardado.');
        return;
      }
      const { snapshot, archivos } = datos;
      // Re-decodificar cada audio y repoblar el trackStore.
      for (const track of snapshot.tracks) {
        const file = archivos[track.fileRef];
        if (!file) continue;
        const buffer = await decodificarArchivo(file);
        putTrackAudio(track.fileRef, file, buffer);
      }
      reemplazarPistas(snapshot.tracks);
      reemplazarBloques(snapshot.bloques);
      reemplazarSecuencia(snapshot.secuencia);
      setEstado('Proyecto cargado ✓');
    } catch (err) {
      setEstado(`Error al cargar: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setOcupado(false);
    }
  }, [reemplazarPistas, reemplazarBloques, reemplazarSecuencia]);

  const exportarWav = useCallback(async () => {
    if (secuencia.length === 0) {
      setEstado('Añade bloques a la secuencia antes de exportar.');
      return;
    }
    setOcupado(true);
    setEstado('Renderizando mezcla…');
    try {
      const buffer = await renderMixToBuffer(plan);
      if (!buffer) {
        setEstado('No hay mezcla que exportar.');
        return;
      }
      const blob = audioBufferToWav(buffer);
      descargarBlob(blob, `${NOMBRE_PROYECTO}.wav`);
      setEstado('Mezcla exportada a WAV ✓');
    } catch (err) {
      setEstado(`Error al exportar: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setOcupado(false);
    }
  }, [secuencia, plan]);

  return { ocupado, estado, hayGuardado, guardar, cargar, exportarWav };
}
