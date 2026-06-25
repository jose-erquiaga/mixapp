/**
 * Motor de reproducción de la mezcla (capability playback).
 *
 * Programa la secuencia con Web Audio de forma sample-accurate (gapless) y
 * aplica las transiciones:
 *  - 'cut': empalme directo con micro-fade de 5 ms en los bordes (anti-clic).
 *  - 'crossfade': solape con rampas equal-power (sin bajón de volumen).
 *  - 'bpm-match': ajusta el tempo del bloque entrante con `playbackRate`.
 *    NOTA: playbackRate cambia también el tono. El time-stretch de alta
 *    calidad (SoundTouch) queda como mejora; el aviso de calidad ya está en
 *    el selector de transición.
 */

import { SequencedBlock } from '@/types/model';
import { getAudioContext, resumeAudioContext } from './audioContext';
import { getTrackBuffer } from './trackStore';

const MICRO_FADE = 0.005; // 5 ms anti-clic en cortes

interface PlanItem {
  buffer: AudioBuffer;
  /** Offset de inicio dentro del buffer de origen (segundos). */
  offsetSeg: number;
  /** Duración del recorte en el origen (segundos). */
  origenSeg: number;
  /** Factor de velocidad (1 = normal; ≠1 en bpm-match). */
  rate: number;
  /** Inicio en la línea de tiempo de la mezcla (segundos). */
  inicioMezcla: number;
  /** Duración efectiva ya reproducida (origenSeg / rate). */
  efectivaSeg: number;
  fadeInSeg: number;
  fadeOutSeg: number;
}

export interface PlanMezcla {
  items: PlanItem[];
  totalSeg: number;
  /** Inicio en la mezcla de cada bloque, para saltar a él. */
  iniciosBloque: number[];
}

/**
 * Construye el plan de reproducción a partir de la secuencia. Resuelve los
 * buffers desde el trackStore (que está cacheado por `fileRef`, no por
 * `trackId`) y calcula tiempos y solapes.
 */
export function construirPlan(
  secuencia: SequencedBlock[],
  bpmDePista: (trackId: string) => number,
  fileRefDePista: (trackId: string) => string | undefined,
): PlanMezcla {
  const items: PlanItem[] = [];
  const iniciosBloque: number[] = [];
  let cursor = 0;

  for (let i = 0; i < secuencia.length; i++) {
    const { block } = secuencia[i];
    const fileRef = fileRefDePista(block.trackId);
    const buffer = fileRef ? getTrackBuffer(fileRef) : undefined;
    if (!buffer) continue;

    // Rate del bloque: lo fija la transición ENTRANTE (la saliente del anterior).
    let rate = 1;
    if (i > 0) {
      const tEntrante = secuencia[i - 1].transitionSaliente;
      if (tEntrante.tipo === 'bpm-match' && tEntrante.bpmObjetivo) {
        rate = tEntrante.bpmObjetivo / bpmDePista(block.trackId);
        if (!isFinite(rate) || rate <= 0) rate = 1;
      }
    }

    const origenSeg = Math.max(0, block.finSeg - block.inicioSeg);
    const efectivaSeg = origenSeg / rate;

    iniciosBloque.push(cursor);
    items.push({
      buffer,
      offsetSeg: block.inicioSeg,
      origenSeg,
      rate,
      inicioMezcla: cursor,
      efectivaSeg,
      fadeInSeg: MICRO_FADE,
      fadeOutSeg: MICRO_FADE,
    });

    // Calcular el solape con el siguiente según la transición saliente.
    const tSaliente = secuencia[i].transitionSaliente;
    let solape = 0;
    if (i < secuencia.length - 1 && tSaliente.tipo === 'crossfade') {
      const siguiente = secuencia[i + 1];
      const origenSig = Math.max(0, siguiente.block.finSeg - siguiente.block.inicioSeg);
      solape = Math.min(tSaliente.duracionSeg ?? 2, efectivaSeg, origenSig);
      items[items.length - 1].fadeOutSeg = solape;
    }

    cursor += efectivaSeg - solape;
  }

  // Total = fin del último bloque.
  let totalSeg = 0;
  for (const it of items) totalSeg = Math.max(totalSeg, it.inicioMezcla + it.efectivaSeg);

  // Aplicar fades-in derivados de los solapes (segunda pasada).
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    if (prev.fadeOutSeg > MICRO_FADE) {
      items[i].fadeInSeg = Math.min(prev.fadeOutSeg, items[i].efectivaSeg);
    }
  }

  return { items, totalSeg, iniciosBloque };
}

/** Curva equal-power (0→1) de N muestras. */
function curvaFadeIn(n = 64): Float32Array {
  const c = new Float32Array(n);
  for (let k = 0; k < n; k++) c[k] = Math.sin((0.5 * Math.PI * k) / (n - 1));
  return c;
}
/** Curva equal-power (1→0) de N muestras. */
function curvaFadeOut(n = 64): Float32Array {
  const c = new Float32Array(n);
  for (let k = 0; k < n; k++) c[k] = Math.cos((0.5 * Math.PI * k) / (n - 1));
  return c;
}

export interface MixPlayerCallbacks {
  onProgress?: (posSeg: number, totalSeg: number) => void;
  onEnded?: () => void;
}

/** Reproductor con transporte (play/pause/seek) sobre un PlanMezcla. */
export class MixPlayer {
  private plan: PlanMezcla = { items: [], totalSeg: 0, iniciosBloque: [] };
  private sources: AudioBufferSourceNode[] = [];
  private master: GainNode | null = null;
  private startClock = 0; // ctx.currentTime cuando empezó (referido a pos 0)
  private posPausa = 0;
  private reproduciendo = false;
  private raf = 0;

  constructor(private cb: MixPlayerCallbacks = {}) {}

  cargar(plan: PlanMezcla) {
    this.detener();
    this.plan = plan;
    this.posPausa = 0;
  }

  get estaReproduciendo() {
    return this.reproduciendo;
  }

  async play(desdeSeg = this.posPausa) {
    await resumeAudioContext();
    const ctx = getAudioContext();
    this.pararFuentes();

    this.master = ctx.createGain();
    this.master.connect(ctx.destination);

    const ahora = ctx.currentTime + 0.05; // pequeño colchón
    this.startClock = ahora - desdeSeg;

    const fadeIn = curvaFadeIn();
    const fadeOut = curvaFadeOut();

    for (const it of this.plan.items) {
      const finItem = it.inicioMezcla + it.efectivaSeg;
      if (finItem <= desdeSeg) continue; // ya pasó

      const parcial = desdeSeg > it.inicioMezcla;
      const elapsedMezcla = parcial ? desdeSeg - it.inicioMezcla : 0;
      const elapsedOrigen = elapsedMezcla * it.rate;
      const cuando = ahora + Math.max(0, it.inicioMezcla - desdeSeg);
      const offset = it.offsetSeg + elapsedOrigen;
      const duracionOrigen = Math.max(0, it.origenSeg - elapsedOrigen);

      const g = ctx.createGain();
      g.connect(this.master);

      const tIni = cuando;
      const tFin = cuando + (it.efectivaSeg - elapsedMezcla);

      if (parcial) {
        g.gain.setValueAtTime(1, tIni); // al saltar a mitad, sin fade-in
      } else {
        g.gain.setValueAtTime(0, tIni);
        g.gain.setValueCurveAtTime(fadeIn, tIni, Math.min(it.fadeInSeg, it.efectivaSeg / 2));
      }
      const fadeOutDur = Math.min(it.fadeOutSeg, it.efectivaSeg / 2);
      g.gain.setValueCurveAtTime(fadeOut, tFin - fadeOutDur, fadeOutDur);

      const src = ctx.createBufferSource();
      src.buffer = it.buffer;
      src.playbackRate.value = it.rate;
      src.connect(g);
      src.start(tIni, offset, duracionOrigen);
      this.sources.push(src);
    }

    this.reproduciendo = true;
    this.tick();
  }

  pause() {
    if (!this.reproduciendo) return;
    const ctx = getAudioContext();
    this.posPausa = Math.min(ctx.currentTime - this.startClock, this.plan.totalSeg);
    this.pararFuentes();
    this.reproduciendo = false;
    cancelAnimationFrame(this.raf);
    this.cb.onProgress?.(this.posPausa, this.plan.totalSeg);
  }

  /** Salta al inicio de un bloque por su índice y reproduce desde ahí. */
  saltarABloque(index: number) {
    const pos = this.plan.iniciosBloque[index] ?? 0;
    this.posPausa = pos;
    if (this.reproduciendo) this.play(pos);
    else this.cb.onProgress?.(pos, this.plan.totalSeg);
  }

  detener() {
    this.pararFuentes();
    this.reproduciendo = false;
    this.posPausa = 0;
    cancelAnimationFrame(this.raf);
  }

  private pararFuentes() {
    for (const s of this.sources) {
      try {
        s.onended = null;
        s.stop();
      } catch {
        // ya parada
      }
    }
    this.sources = [];
    if (this.master) {
      this.master.disconnect();
      this.master = null;
    }
  }

  private tick = () => {
    if (!this.reproduciendo) return;
    const ctx = getAudioContext();
    const pos = ctx.currentTime - this.startClock;
    if (pos >= this.plan.totalSeg) {
      this.reproduciendo = false;
      this.posPausa = 0;
      this.pararFuentes();
      this.cb.onProgress?.(this.plan.totalSeg, this.plan.totalSeg);
      this.cb.onEnded?.();
      return;
    }
    this.cb.onProgress?.(Math.max(0, pos), this.plan.totalSeg);
    this.raf = requestAnimationFrame(this.tick);
  };
}
