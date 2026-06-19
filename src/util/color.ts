/**
 * Color estable por pista: misma canción → mismo color (spec mix-canvas,
 * "Identidad visual por canción"). Se deriva del id de la pista para que sea
 * consistente entre el editor y el lienzo sin guardar estado extra.
 */

const PALETA = [
  '#4a9eff', // azul
  '#ff6b6b', // rojo
  '#51cf66', // verde
  '#fcc419', // amarillo
  '#cc5de8', // morado
  '#ff922b', // naranja
  '#22b8cf', // cian
  '#f06595', // rosa
];

/** Devuelve un color de la paleta de forma determinista a partir de un id. */
export function colorParaPista(trackId: string): string {
  let hash = 0;
  for (let i = 0; i < trackId.length; i++) {
    hash = (hash * 31 + trackId.charCodeAt(i)) >>> 0;
  }
  return PALETA[hash % PALETA.length];
}
