/**
 * Previsualización de una región aislada de audio (tarea 3.5 / 3.1 editor).
 * Reproduce solo [inicioSeg, finSeg) de un AudioBuffer con Web Audio.
 *
 * En modo `loop` usa el bucle nativo de `AudioBufferSourceNode`
 * (loop/loopStart/loopEnd): repite con precisión de muestra y SIN el
 * micro-silencio que dejaba reiniciar la posición a mano (re-seek).
 */

import { getAudioContext, resumeAudioContext } from './audioContext';

export interface PreviewHandle {
  stop(): void;
  /** Posición de reproducción actual dentro del buffer (segundos). */
  posicionSeg(): number;
  /** Reajusta los límites de la región (en loop, sin cortar el sonido). */
  actualizarRegion(inicioSeg: number, finSeg: number): void;
}

export interface PreviewOpts {
  /** Repetir la región en bucle continuo (sin cortes). */
  loop?: boolean;
}

/**
 * Reproduce la región [inicioSeg, finSeg) del buffer. Devuelve un handle para
 * detenerla, leer la posición del cabezal y reajustar la región. `onEnded` se
 * llama cuando termina sola (nunca en modo loop).
 */
export async function previsualizarRegion(
  buffer: AudioBuffer,
  inicioSeg: number,
  finSeg: number,
  onEnded?: () => void,
  opts: PreviewOpts = {},
): Promise<PreviewHandle> {
  await resumeAudioContext();
  const ctx = getAudioContext();

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);

  let inicio = inicioSeg;
  let fin = finSeg;
  const loop = opts.loop ?? false;

  if (loop) {
    source.loop = true;
    source.loopStart = inicio;
    source.loopEnd = fin;
  }

  source.onended = () => {
    onEnded?.();
  };

  const t0 = ctx.currentTime;
  // En loop NO se pasa `duration`: limitaría el tiempo TOTAL reproducido y
  // cortaría el bucle. El bucle lo gestiona loopStart/loopEnd.
  if (loop) source.start(0, inicio);
  else source.start(0, inicio, Math.max(0, fin - inicio));

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
    posicionSeg() {
      const elapsed = ctx.currentTime - t0;
      const dur = Math.max(1e-6, fin - inicio);
      if (loop) return inicio + (elapsed % dur);
      return inicio + Math.min(elapsed, dur);
    },
    actualizarRegion(nuevoInicio: number, nuevoFin: number) {
      inicio = nuevoInicio;
      fin = nuevoFin;
      if (loop) {
        source.loopStart = nuevoInicio;
        source.loopEnd = nuevoFin;
      }
    },
  };
}
