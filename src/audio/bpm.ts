/**
 * Detección de BPM (tarea 2.3).
 *
 * Envoltorio fino sobre la librería de detección para que el resto de la app
 * no dependa de su API concreta. La elección definitiva queda pendiente del
 * spike (ver design.md / tasks 1.3); de momento se usa web-audio-beat-detector
 * por ser ligera y suficiente para el MVP. Cambiarla solo afecta a este módulo.
 */

import { analyze } from 'web-audio-beat-detector';

/**
 * Estima el BPM de un AudioBuffer. Devuelve un entero redondeado.
 * Si la estimación falla, devuelve `null` para que la UI pida el BPM manual.
 */
export async function estimarBpm(buffer: AudioBuffer): Promise<number | null> {
  try {
    const tempo = await analyze(buffer);
    return Math.round(tempo);
  } catch {
    return null;
  }
}
