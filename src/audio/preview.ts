/**
 * Previsualización de una región aislada de audio (tarea 3.5 / 3.1 editor).
 * Reproduce solo [inicioSeg, finSeg) de un AudioBuffer con Web Audio.
 */

import { getAudioContext, resumeAudioContext } from './audioContext';

export interface PreviewHandle {
  stop(): void;
}

/**
 * Reproduce la región [inicioSeg, finSeg) del buffer. Devuelve un handle para
 * detenerla. `onEnded` se llama cuando termina sola.
 */
export async function previsualizarRegion(
  buffer: AudioBuffer,
  inicioSeg: number,
  finSeg: number,
  onEnded?: () => void,
): Promise<PreviewHandle> {
  await resumeAudioContext();
  const ctx = getAudioContext();

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);

  const duracion = Math.max(0, finSeg - inicioSeg);
  source.onended = () => {
    onEnded?.();
  };
  source.start(0, inicioSeg, duracion);

  let detenido = false;
  return {
    stop() {
      if (detenido) return;
      detenido = true;
      source.onended = null;
      try {
        source.stop();
      } catch {
        // ya parado
      }
    },
  };
}
