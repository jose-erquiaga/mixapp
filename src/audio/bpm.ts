/**
 * Detección de BPM (tarea 2.3).
 *
 * Envoltorio fino sobre la librería de detección para que el resto de la app
 * no dependa de su API concreta. Tras el spike (ver `spike/bpm/`) se eligió
 * **realtime-bpm-analyzer**: ligera (~160 KB, sin dependencias), muy mantenida
 * y robusta frente a jitter y ruido. Cambiarla solo afecta a este módulo.
 */

import { analyzeFullBuffer } from 'realtime-bpm-analyzer';

/**
 * Estima el BPM de un AudioBuffer. Devuelve un entero redondeado.
 * Si la estimación falla o no encuentra candidatos, devuelve `null` para que
 * la UI pida el BPM manual (ver spec library, corrección manual).
 */
export async function estimarBpm(buffer: AudioBuffer): Promise<number | null> {
  try {
    const candidatos = await analyzeFullBuffer(buffer);
    if (!candidatos || candidatos.length === 0) return null;
    // El primer candidato es el de mayor confianza (más coincidencias).
    return Math.round(candidatos[0].tempo);
  } catch {
    return null;
  }
}
