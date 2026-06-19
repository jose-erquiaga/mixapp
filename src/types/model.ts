/**
 * Modelo de datos de MIXAPP (Fase 1 — MVP).
 *
 * Refleja el borrador de `openspec/changes/add-mix-builder-mvp/design.md`.
 * Las unidades de tiempo van en segundos salvo que el nombre indique otra cosa.
 */

/** Tipos de transición entre dos bloques consecutivos en el lienzo. */
export type TransitionType = 'cut' | 'crossfade' | 'bpm-match';

/**
 * Una pista importada: el audio de origen que aporta el usuario.
 * El `AudioBuffer` decodificado vive en memoria; `fileRef` es la referencia
 * persistible (clave en IndexedDB) al archivo original.
 */
export interface Track {
  id: string;
  nombre: string;
  /** Referencia al archivo original almacenado localmente (IndexedDB). */
  fileRef: string;
  sampleRate: number;
  duracionSeg: number;
  /** BPM estimado al importar; el usuario puede corregirlo. */
  bpm: number;
}

/**
 * Un "bloque": una región etiquetada (intro, estribillo, outro…) recortada
 * de una pista. Es la unidad que se arrastra al lienzo de mezcla.
 */
export interface Block {
  id: string;
  trackId: string;
  etiqueta: string;
  inicioSeg: number;
  finSeg: number;
  /** Color heredado de la pista de origen, para identidad visual. */
  color: string;
}

/** Configuración de la unión entre un bloque y el siguiente. */
export interface Transition {
  tipo: TransitionType;
  /** Duración del crossfade, en segundos. Solo aplica a 'crossfade'. */
  duracionSeg?: number;
  /** BPM objetivo del time-stretch. Solo aplica a 'bpm-match'. */
  bpmObjetivo?: number;
}

/**
 * Un bloque colocado en la secuencia del lienzo, junto con la transición
 * que lo une al bloque siguiente (la del último bloque se ignora).
 */
export interface SequencedBlock {
  block: Block;
  transitionSaliente: Transition;
}

/** El proyecto completo: lo que se guarda y se carga. */
export interface Project {
  id: string;
  nombre: string;
  tracks: Track[];
  bloquesOrdenados: SequencedBlock[];
}

/** Transición por defecto al encadenar dos bloques (ver spec mix-canvas). */
export const TRANSICION_POR_DEFECTO: Transition = {
  tipo: 'crossfade',
  duracionSeg: 2,
};
