## Context
Greenfield. No hay base de código. El reto técnico no es novedoso (las apps DJ
hacen esto), el valor es de UX. Se prioriza robustez sobre potencia: el marcado
manual con imán al beat es la base fiable; la IA de secciones se pospone a Fase 2/3.

## Plataforma objetivo
- **App 100% web**: no se instala, corre en el navegador; el SO (Windows/Mac/
  Linux) es indiferente. No hay binarios nativos en Fase 1.
- **Navegadores objetivo**: Chrome, Edge y Firefox de escritorio como base.
  Safari y móviles requieren pruebas aparte (Web Audio en iOS suspende el audio
  de forma agresiva; `decodeAudioData` no soporta todos los formatos).
- **UI escritorio + móvil responsive desde el inicio**: el escritorio (ratón,
  pantalla grande) es el caso de uso principal para arrastrar bloques y editar
  la onda con precisión, pero el layout debe adaptarse y ser usable en móvil.
- Empaquetado "instalable" (PWA / Tauri / Electron) se valora en Fase 2+; no
  afecta al código actual.

## Decisiones técnicas
- **Web Audio API** como motor. Cada bloque es una región (offset inicio/fin)
  sobre un `AudioBuffer` decodificado de un archivo importado.
- **Reproducción** programada con `AudioBufferSourceNode` + `start(when, offset,
  duration)` para empalmes sample-accurate; crossfades con `GainNode` y rampas.
- **Ajuste de BPM**: SoundTouchJS sobre el buffer del bloque; saltos grandes
  degradan la calidad — avisar en UI, no impedir.
- **Exportación**: re-render de toda la secuencia en `OfflineAudioContext` →
  `AudioBuffer` → WAV. MP3 se deja para más adelante (encoder WASM).
- **Persistencia (IndexedDB)**: el proyecto guarda bloques, orden, transiciones,
  BPM y etiquetas. Decisión abierta: ¿guardar también los archivos de audio
  decodificados en IndexedDB (proyecto autocontenido, pesado) o solo referencias
  y pedir re-importar al abrir? Recomendado para MVP: guardar los archivos en
  IndexedDB para que el proyecto sea portable sin re-vincular.

## Modelo de datos (borrador)
- `Track`: { id, nombre, fileRef, sampleRate, duracionSeg, bpm }
- `Block`: { id, trackId, etiqueta, inicioSeg, finSeg, color }
- `Transition`: { tipo: 'cut'|'crossfade'|'bpm-match', duracionSeg?, bpmObjetivo? }
- `Project`: { id, nombre, tracks[], bloquesOrdenados: [{block, transitionSaliente}] }

## Decisiones cerradas tras spike
- **Librería de BPM**: `realtime-bpm-analyzer` (ver `spike/bpm/`). Es la más
  ligera (~160 KB, sin deps), la más mantenida y robusta a jitter/ruido en la
  prueba cuantitativa. Se descartan `web-audio-beat-detector` (acoplada a
  Worker/Blob, solo navegador) y `essentia.js` (10 MB y ~4 años sin cambios;
  reconsiderable en Fase 3 para MIR avanzado). Validación con música real
  pendiente en el issue de Biblioteca.

## Open questions
- ¿Detección de downbeats (compás) o solo beats en Fase 1? MVP: solo beats.
- Formatos de importación a garantizar (mp3/wav seguro; m4a/ogg/flac según
  soporte de `decodeAudioData` del navegador objetivo).
