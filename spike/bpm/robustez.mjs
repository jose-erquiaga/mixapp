/**
 * Spike de BPM — prueba de robustez de realtime-bpm-analyzer.
 *
 * Va más allá del patrón limpio: añade jitter temporal, ruido de fondo,
 * tempos no enteros y un patrón más disperso, para ver dónde falla la
 * librería que proponemos para el MVP.
 *
 * Ejecutar:  node spike-bpm-robustez.mjs
 */
import * as nodeWebAudio from 'node-web-audio-api';
globalThis.OfflineAudioContext = nodeWebAudio.OfflineAudioContext;
globalThis.AudioContext = nodeWebAudio.AudioContext;
globalThis.AudioBuffer = nodeWebAudio.AudioBuffer;
const { OfflineAudioContext } = nodeWebAudio;
const { analyzeFullBuffer } = await import('realtime-bpm-analyzer');

const SR = 44100;
const DUR = 20;

function golpe(data, m0, freq, decay, gan, ruido = 0) {
  const len = Math.floor(SR * decay);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t / (decay * 0.3));
    const tono = Math.sin(2 * Math.PI * freq * t);
    const n = (Math.random() * 2 - 1) * ruido;
    const idx = m0 + i;
    if (idx >= 0 && idx < data.length) data[idx] += (tono * (1 - ruido) + n) * env * gan;
  }
}

function generar(bpm, { jitterMs = 0, ruidoFondo = 0 } = {}) {
  const ctx = new OfflineAudioContext(1, SR * DUR, SR);
  const buffer = ctx.createBuffer(1, SR * DUR, SR);
  const data = buffer.getChannelData(0);
  if (ruidoFondo > 0) for (let i = 0; i < data.length; i++) data[i] += (Math.random() * 2 - 1) * ruidoFondo;

  const segBeat = 60 / bpm;
  const total = Math.floor(DUR / segBeat);
  for (let b = 0; b < total; b++) {
    const jitter = ((Math.random() * 2 - 1) * jitterMs) / 1000;
    const t = b * segBeat + jitter;
    const m = Math.floor(t * SR);
    golpe(data, m, 60, 0.18, 0.9);
    if (b % 2 === 1) golpe(data, m, 200, 0.12, 0.7, 0.6);
    const mc = Math.floor((t + segBeat / 2) * SR);
    golpe(data, mc, 8000, 0.04, 0.3, 0.9);
  }
  return buffer;
}

async function estimar(buffer) {
  try {
    const r = await analyzeFullBuffer(buffer);
    return r && r.length ? r[0].tempo : null;
  } catch {
    return null;
  }
}

const casos = [
  { nombre: 'limpio 120',        bpm: 120, opts: {} },
  { nombre: 'limpio 128',        bpm: 128, opts: {} },
  { nombre: 'no entero 123.5',   bpm: 123.5, opts: {} },
  { nombre: 'jitter ±8ms 120',   bpm: 120, opts: { jitterMs: 8 } },
  { nombre: 'jitter ±20ms 128',  bpm: 128, opts: { jitterMs: 20 } },
  { nombre: 'ruido fondo 0.15',  bpm: 120, opts: { ruidoFondo: 0.15 } },
  { nombre: 'ruido fondo 0.30',  bpm: 128, opts: { ruidoFondo: 0.30 } },
  { nombre: 'jitter+ruido 140',  bpm: 140, opts: { jitterMs: 12, ruidoFondo: 0.15 } },
];

console.log('caso                  | real  | estimado | Δ');
console.log('----------------------|-------|----------|-----');
for (const c of casos) {
  const est = await estimar(generar(c.bpm, c.opts));
  const d = est == null ? 'N/A' : Math.abs(est - c.bpm).toFixed(1);
  console.log(
    `${c.nombre.padEnd(21)} | ${String(c.bpm).padStart(5)} | ${(est == null ? 'N/A' : est.toFixed(1)).padStart(8)} | ${d}`,
  );
}
