/**
 * Almacén en memoria del audio de las pistas importadas.
 *
 * Guarda tanto el `File` original (para que wavesurfer pinte la onda y pueda
 * reproducir vía object URL) como el `AudioBuffer` decodificado (para análisis
 * y reproducción con Web Audio). Está cacheado por `fileRef`.
 *
 * En Fase 1 vive solo en memoria; en Fase 2 el `File` se moverá a IndexedDB
 * (ver design.md) y este módulo será la única capa que haya que tocar.
 */

interface TrackAudio {
  file: File;
  buffer: AudioBuffer;
  /** object URL perezoso para wavesurfer; se crea bajo demanda. */
  objectUrl?: string;
}

const almacen = new Map<string, TrackAudio>();

export function putTrackAudio(fileRef: string, file: File, buffer: AudioBuffer): void {
  almacen.set(fileRef, { file, buffer });
}

export function getTrackBuffer(fileRef: string): AudioBuffer | undefined {
  return almacen.get(fileRef)?.buffer;
}

/** Devuelve (creando si hace falta) un object URL del archivo, para wavesurfer. */
export function getTrackObjectUrl(fileRef: string): string | undefined {
  const entrada = almacen.get(fileRef);
  if (!entrada) return undefined;
  if (!entrada.objectUrl) {
    entrada.objectUrl = URL.createObjectURL(entrada.file);
  }
  return entrada.objectUrl;
}

export function removeTrackAudio(fileRef: string): void {
  const entrada = almacen.get(fileRef);
  if (entrada?.objectUrl) {
    URL.revokeObjectURL(entrada.objectUrl);
  }
  almacen.delete(fileRef);
}
