/**
 * Spike de detección de BPM — prueba cuantitativa con BPM conocido.
 *
 * Genera patrones de batería sintéticos (kick/snare/hi-hat) a tempos conocidos
 * y mide qué estima realtime-bpm-analyzer (la librería elegida).
 * No es música real, pero da un suelo objetivo y reproducible.
 *
 * web-audio-beat-detector se descartó en el spike y no se prueba aquí: solo
 * corre en navegador (instancia un Worker desde una Blob URL).
 *
 * Ejecutar:  node spike/bpm/precision.mjs
 */
import * as nodeWebAudio from 'node-web-audio-api';

// Polyfill de entorno: la librería espera los globales de Web Audio del navegador.
globalThis.OfflineAudioContext = nodeWebAudio.OfflineAudioContext;
globalThis.AudioContext = nodeWebAudio.AudioContext;
globalThis.AudioBuffer = nodeWebAudio.AudioBuffer;

const { OfflineAudioContext } = nodeWebAudio;
const { analyzeFullBuffer } = await import('realtime-bpm-analyzer');

const SAMPLE_RATE = 44100;
const DURACION_SEG = 20;

/** Genera un golpe percusivo: ruido/seno con envolvente exponencial. */
function golpe(data, inicioMuestra, freq, decay, ganancia, ruido = 0) {
  const len = Math.floor(SAMPLE_RATE * decay);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t / (decay * 0.3));
    const tono = Math.sin(2 * Math.PI * freq * t);
    const n = (Math.random() * 2 - 1) * ruido;
    const idx = inicioMuestra + i;
    if (idx < data.length) data[idx] += (tono * (1 - ruido) + n) * env * ganancia;
  }
}

/** Construye un AudioBuffer con un patrón de batería 4/4 al BPM dado. */
function generarBateria(bpm) {
  const ctx = new OfflineAudioContext(1, SAMPLE_RATE * DURACION_SEG, SAMPLE_RATE);
  const buffer = ctx.createBuffer(1, SAMPLE_RATE * DURACION_SEG, SAMPLE_RATE);
  const data = buffer.getChannelData(0);

  const segPorBeat = 60 / bpm;
  const totalBeats = Math.floor(DURACION_SEG / segPorBeat);

  for (let beat = 0; beat < totalBeats; beat++) {
    const t = beat * segPorBeat;
    const m = Math.floor(t * SAMPLE_RATE);
    // kick en cada negra
    golpe(data, m, 60, 0.18, 0.9);
    // snare en los tiempos 2 y 4
    if (beat % 2 === 1) golpe(data, m, 200, 0.12, 0.7, 0.6);
    // hi-hat en corcheas (entre negras)
    const mCorchea = Math.floor((t + segPorBeat / 2) * SAMPLE_RATE);
    golpe(data, mCorchea, 8000, 0.04, 0.3, 0.9);
  }
  return buffer;
}

function err(estimado, real) {
  if (estimado == null) return 'N/A';
  const e = Math.abs(estimado - real);
  // tolera el típico error de octava (mitad/doble de tempo)
  const eOctava = Math.min(e, Math.abs(estimado * 2 - real), Math.abs(estimado / 2 - real));
  return `${estimado.toFixed(1)} (Δ ${e.toFixed(1)}${eOctava < e ? `, Δoct ${eOctava.toFixed(1)}` : ''})`;
}

const tempos = [90, 100, 120, 128, 140, 174];

console.log('BPM real | realtime-bpm-analyzer');
console.log('---------|----------------------');

for (const bpm of tempos) {
  const buffer = generarBateria(bpm);

  let rt = null;
  try {
    const res = await analyzeFullBuffer(buffer);
    rt = res && res.length ? res[0].tempo : null;
  } catch {
    rt = null;
  }

  console.log(`${String(bpm).padStart(8)} | ${err(rt, bpm)}`);
}
