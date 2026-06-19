/**
 * Hook de estado para la biblioteca de pistas (importadas por el usuario).
 * Maneja importación, decodificación, estimación de BPM y edición manual.
 */

import { useState, useCallback } from 'react';
import { Track } from '@/types/model';
import { decodificarArchivo, FormatoNoSoportadoError } from '@/audio/decode';
import { estimarBpm } from '@/audio/bpm';
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
}

export function useLibrary(): LibraryState & LibraryActions {
  const [pistas, setPistas] = useState<Track[]>([]);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importarArchivos = useCallback(
    async (files: File[]) => {
      setImportando(true);
      setError(null);

      for (const file of files) {
        try {
          // Decodificar el audio
          const buffer = await decodificarArchivo(file);
          const duracionSeg = buffer.duration;
          const sampleRate = buffer.sampleRate;

          // Estimar BPM (puede devolver null si falla)
          const bpm = (await estimarBpm(buffer)) ?? 120;

          // Crear pista
          const fileRef = crypto.randomUUID();
          const pista: Track = {
            id: crypto.randomUUID(),
            nombre: file.name.replace(/\.[^/.]+$/, ''), // quitar extensión
            fileRef,
            sampleRate,
            duracionSeg,
            bpm,
          };

          // Guardar audio (File + AudioBuffer) en el almacén compartido.
          putTrackAudio(fileRef, file, buffer);

          setPistas((prev) => [...prev, pista]);
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

  return {
    pistas,
    importando,
    error,
    importarArchivos,
    actualizarBpm,
    eliminarPista,
    limpiarError,
  };
}
