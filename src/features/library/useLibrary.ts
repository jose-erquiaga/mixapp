/**
 * Hook de estado para la biblioteca de pistas (importadas por el usuario).
 * Maneja importación, decodificación, estimación de BPM y edición manual.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Track } from '@/types/model';
import { decodificarArchivo, FormatoNoSoportadoError } from '@/audio/decode';
import { estimarBpm } from '@/audio/bpm';
import { hashArchivo } from '@/audio/hash';
import { putTrackAudio, removeTrackAudio } from '@/audio/trackStore';

export interface LibraryState {
  pistas: Track[];
  importando: boolean;
  error: string | null;
}

export interface LibraryActions {
  importarArchivos(files: File[]): Promise<void>;
  actualizarBpm(trackId: string, bpm: number): void;
  eliminarPista(trackId: string): void;
  limpiarError(): void;
  /** Reemplaza la lista de pistas (al cargar un proyecto guardado). */
  reemplazarPistas(pistas: Track[]): void;
  /** Añade una pista (al cargar desde la biblioteca local). */
  anadirPista(pista: Track): void;
}

export interface LibraryOpts {
  /** Se llama con el id (hash) de cada pista recién importada. */
  onImportado?: (id: string) => void;
}

export function useLibrary(opts?: LibraryOpts): LibraryState & LibraryActions {
  const [pistas, setPistas] = useState<Track[]>([]);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Espejo de `pistas` para deduplicar entre llamadas sin re-crear el callback.
  const pistasRef = useRef(pistas);
  useEffect(() => {
    pistasRef.current = pistas;
  }, [pistas]);

  const onImportadoRef = useRef(opts?.onImportado);
  useEffect(() => {
    onImportadoRef.current = opts?.onImportado;
  }, [opts?.onImportado]);

  const importarArchivos = useCallback(
    async (files: File[]) => {
      setImportando(true);
      setError(null);

      // Ids ya vistos en este lote (las pistas añadidas aún no están en el ref).
      const vistos = new Set<string>();

      for (const file of files) {
        try {
          // Identidad estable por contenido (issue #9): el hash es id y fileRef.
          const id = await hashArchivo(file);

          // Dedupe: misma canción ya importada → no duplicar.
          if (vistos.has(id) || pistasRef.current.some((p) => p.id === id)) {
            vistos.add(id);
            continue;
          }
          vistos.add(id);

          // Decodificar el audio
          const buffer = await decodificarArchivo(file);
          const duracionSeg = buffer.duration;
          const sampleRate = buffer.sampleRate;

          // Estimar BPM (puede devolver null si falla)
          const bpm = (await estimarBpm(buffer)) ?? 120;

          // id === fileRef === hash: unifica la identidad y evita el cruce
          // trackId/fileRef que dejó la mezcla en silencio en el MVP.
          const pista: Track = {
            id,
            nombre: file.name.replace(/\.[^/.]+$/, ''), // quitar extensión
            fileRef: id,
            sampleRate,
            duracionSeg,
            bpm,
          };

          // Guardar audio (File + AudioBuffer) en el almacén compartido.
          putTrackAudio(id, file, buffer);

          setPistas((prev) => [...prev, pista]);
          onImportadoRef.current?.(id);
        } catch (err) {
          if (err instanceof FormatoNoSoportadoError) {
            setError(`${file.name}: ${err.message}`);
          } else {
            setError(
              `Error importando ${file.name}: ${err instanceof Error ? err.message : 'desconocido'}`,
            );
          }
        }
      }

      setImportando(false);
    },
    [],
  );

  const actualizarBpm = useCallback((trackId: string, bpm: number) => {
    setPistas((prev) => prev.map((p) => (p.id === trackId ? { ...p, bpm } : p)));
  }, []);

  const eliminarPista = useCallback((trackId: string) => {
    setPistas((prev) => {
      const pista = prev.find((p) => p.id === trackId);
      if (pista) {
        removeTrackAudio(pista.fileRef);
      }
      return prev.filter((p) => p.id !== trackId);
    });
  }, []);

  const limpiarError = useCallback(() => setError(null), []);

  const reemplazarPistas = useCallback((nuevas: Track[]) => setPistas(nuevas), []);

  const anadirPista = useCallback(
    (pista: Track) => setPistas((prev) => (prev.some((p) => p.id === pista.id) ? prev : [...prev, pista])),
    [],
  );

  return {
    pistas,
    importando,
    error,
    importarArchivos,
    actualizarBpm,
    eliminarPista,
    limpiarError,
    reemplazarPistas,
    anadirPista,
  };
}
