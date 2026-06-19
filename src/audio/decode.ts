/**
 * Decodificación de archivos de audio a AudioBuffer mediante Web Audio.
 *
 * Cubre la tarea 2.2 (validar formato): si `decodeAudioData` no puede con el
 * archivo, se lanza `FormatoNoSoportadoError` para que la UI avise (spec library).
 */

import { getAudioContext } from './audioContext';

export class FormatoNoSoportadoError extends Error {
  constructor(nombreArchivo: string) {
    super(`No se pudo decodificar el archivo "${nombreArchivo}": formato no soportado.`);
    this.name = 'FormatoNoSoportadoError';
  }
}

/**
 * Decodifica un `File` de audio a `AudioBuffer`.
 * @throws {FormatoNoSoportadoError} si el navegador no puede decodificarlo.
 */
export async function decodificarArchivo(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    // copia el buffer: decodeAudioData consume (detacha) el ArrayBuffer.
    return await getAudioContext().decodeAudioData(arrayBuffer.slice(0));
  } catch {
    throw new FormatoNoSoportadoError(file.name);
  }
}
