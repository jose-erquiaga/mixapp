/**
 * Cálculo de la rejilla de beats a partir del BPM (tarea 3.2) y el imán al
 * beat (tarea 3.3).
 *
 * Asumimos que el primer beat cae en t=0 (sin detección de offset/downbeat en
 * Fase 1; ver design.md). El intervalo entre beats es 60/bpm segundos.
 */

/** Segundos entre dos beats consecutivos para un BPM dado. */
export function intervaloBeatSeg(bpm: number): number {
  return 60 / bpm;
}

/**
 * Tiempos (en segundos) de todos los beats dentro de [0, duracionSeg].
 * Pensado para dibujar la rejilla.
 */
export function tiemposBeats(bpm: number, duracionSeg: number): number[] {
  const intervalo = intervaloBeatSeg(bpm);
  if (intervalo <= 0 || duracionSeg <= 0) return [];
  const tiempos: number[] = [];
  for (let t = 0; t <= duracionSeg + 1e-9; t += intervalo) {
    tiempos.push(t);
  }
  return tiempos;
}

/** Imanta un instante al beat más cercano. */
export function imantarAlBeat(tiempoSeg: number, bpm: number): number {
  const intervalo = intervaloBeatSeg(bpm);
  if (intervalo <= 0) return tiempoSeg;
  return Math.round(tiempoSeg / intervalo) * intervalo;
}
