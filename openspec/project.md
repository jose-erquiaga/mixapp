# MIXAPP

## Purpose
MIXAPP es un constructor de mezclas musicales **en frío** (no en directo) y
orientado al usuario no-DJ: importas tus canciones, las troceas en bloques
(intro, estribillo, outro…), y los arrastras a un lienzo para armar una mezcla
encadenada para una fiesta o reunión. El valor está en la **sencillez y lo
lúdico**, no en competir en potencia con software DJ profesional.

## Constraints (decisiones de partida ya cerradas)
- **El audio lo aporta el usuario** (archivos locales). Spotify/Tidal quedan
  fuera para tratar audio: su reproducción va en una caja con DRM (EME) que no
  expone las muestras PCM, y sus licencias prohíben la manipulación por terceros.
  No es una limitación a sortear: es un muro de diseño y legal.
- **Todo el procesado de audio ocurre en el cliente** (navegador, Web Audio API).
  Sin subir audio a servidores en la Fase 1.
- La separación de stems (Fase 3) es la única pieza que requerirá servidor.

## Tech Stack
- Frontend: React + Vite + TypeScript.
- Audio: Web Audio API nativa.
- Onda + interacción: wavesurfer.js.
- Detección de BPM/beats: librería cliente (p. ej. web-audio-beat-detector /
  realtime-bpm-analyzer / essentia.js — a decidir en spike).
- Time-stretch para ajuste de BPM: SoundTouchJS (o Rubberband WASM).
- Exportación: OfflineAudioContext + conversión a WAV (audiobuffer-to-wav).
- Persistencia local: IndexedDB.

## Roadmap (fases)
- **Fase 1 (MVP, este change):** importar archivos, detección de BPM, editor de
  onda con marcado de bloques e imán al beat, lienzo de bloques en una línea,
  transiciones (corte/crossfade/ajuste de BPM), reproducción encadenada,
  guardar proyecto y exportar a WAV.
- **Fase 2:** multi-canal + loops sincronizados al beat (superponer canciones
  enteras en varias pistas).
- **Fase 3:** separación de stems en servidor (voz/batería/bajo/otros) para
  superponer instrumentos sueltos. Es la palanca de monetización (freemium /
  créditos por separación).

## Conventions
- Specs y código documentados en castellano; marcadores estructurales OpenSpec
  (Requirement/Scenario/WHEN/THEN/SHALL) en inglés.
- Una capability = un dominio funcional bajo `openspec/specs/<capability>/`.
