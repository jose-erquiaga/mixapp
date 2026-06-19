# MIXAPP

Constructor de mezclas musicales **por bloques**, pensado para usuario no-DJ y
funcionando **100% en el navegador** con los archivos de audio del propio
usuario. Importas tus canciones, las troceas en bloques (intro, estribillo,
outro…) y los arrastras a un lienzo para armar una mezcla encadenada.

> El valor está en la sencillez y lo lúdico, no en competir con software DJ
> profesional. Todo el procesado de audio ocurre en el cliente (Web Audio API).

## Stack

- **React + Vite + TypeScript**
- **Web Audio API** (motor de audio)
- **wavesurfer.js** (onda + interacción)
- **realtime-bpm-analyzer** (detección de BPM — elegida tras spike, ver `spike/bpm/`)
- **IndexedDB** (persistencia local)

## Puesta en marcha

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # build de producción
npm run lint       # ESLint
npm run typecheck  # comprobación de tipos
npm run format     # Prettier
```

## Estructura

```
src/
  audio/        Motor de audio: contexto, decodificación, BPM
  features/     Una carpeta por capability del MVP
    library/
    waveform-editor/
    mix-canvas/
    playback/
    persistence/
  types/        Modelo de datos (Track, Block, Transition, Project)
openspec/       Specs y change activo (add-mix-builder-mvp)
```

## Roadmap

- **Fase 1 (MVP, en curso):** importar, detección de BPM, editor de onda con
  bloques e imán al beat, lienzo, transiciones, reproducción encadenada,
  guardar proyecto y exportar a WAV.
- **Fase 2:** multi-canal + loops sincronizados al beat.
- **Fase 3:** separación de stems en servidor (monetización freemium).

El seguimiento de tareas está en los issues de GitHub (etiqueta `fase-1-mvp`) y
en `openspec/changes/add-mix-builder-mvp/tasks.md`.
