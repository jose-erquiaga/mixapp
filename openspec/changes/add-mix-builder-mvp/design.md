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
- **UI móvil primero, interacción por toques**: el móvil es el dispositivo
  objetivo real (se usará sobre todo ahí). Las interacciones se diseñan para el
  dedo: ajuste de marcas con botones de nudge (±beat / ±fino) en vez de
  arrastrar con precisión, y "añadir al lienzo" / reordenar con controles
  explícitos en vez de drag-and-drop frágil. El arrastrar puede convivir como
  comodidad en escritorio, pero no es el patrón base.
- Empaquetado "instalable" (PWA / Tauri / Electron) se valora en Fase 2+; no
  afecta al código actual.

## Decisiones técnicas
- **Web Audio API** como motor. Cada bloque es una región (offset inicio/fin)
  sobre un `AudioBuffer` decodificado de un archivo importado.
- **Reproducción** programada con `AudioBufferSourceNode` + `start(when, offset,
  duration)` para empalmes sample-accurate; crossfades con `GainNode` y rampas.
- **Almacén de audio (`trackStore`)**: se indexa por `fileRef` (referencia
  persistible, futura clave de IndexedDB), NO por `trackId`. `Track.id` y
  `Track.fileRef` son UUIDs distintos. Cualquier consumidor que parta de un
  `Block` (que solo guarda `trackId`) debe resolver `trackId → fileRef` antes de
  pedir el buffer; el plan de reproducción lo hace con el resolver
  `fileRefDePista` que recibe `construirPlan`. (Un cruce `trackId`/`fileRef` dejó
  la mezcla en silencio; ver fix de reproducción.)
- **Loop sin cortes en el editor**: el bucle de la selección (🔁 Loop) usa el
  loop NATIVO de `AudioBufferSourceNode` (`loop` + `loopStart`/`loopEnd`), que
  repite con precisión de muestra. Reiniciar la posición a mano vía wavesurfer
  (`setTime` al detectar el fin en `timeupdate`) dejaba un micro-silencio en cada
  vuelta, porque `timeupdate` no es exacto. El cabezal visual se anima aparte con
  `requestAnimationFrame` leyendo el reloj del AudioContext (ver `preview.ts`,
  `previsualizarRegion({ loop: true })`). Esto es la base del "dejar loops" de
  Fase 2.
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

## Decisiones implementadas en editor de pista

### Reproducción integrada en el editor
El editor integra reproducción de la pista completa y de la región marcada (loop),
permitiendo al usuario oír la selección mientras la ajusta. Controles:
- **▶ Pista**: play/pause de la pista completa (cabezal sin restricción).
- **🔁 Loop selección**: play/pause que reinicia automáticamente al llegar al fin
  de la región (útil para afinar sin que pase toda la pista).

El cabezal se actualiza en tiempo real (timeupdate), mostrando el tiempo actual
en la cabecera para referencia visual.

### Marcado por oído ("marcar aquí")
Dos botones permiten fijar inicio o fin en la posición actual del cabezal:
- **⇤ Inicio aquí**: fija el inicio en la posición del cabezal (imantado al beat
  si el imán está activo).
- **Fin aquí ⇥**: fija el fin en la posición del cabezal (imantado al beat si
  el imán está activo).

Junto con la reproducción integrada, esto permite flujo óptimo en móvil:
"reproduce, cuando suena el punto justo pulsa 'Inicio aquí', continúa hasta
el siguiente punto y pulsa 'Fin aquí ⇥'".

### Arreglo: separación entre cambios manuales y cambios programáticos del imán
**Problema**: El imán al beat pisaba cambios de nudge (flechas ±beat/±fino),
devolviendo la marca al beat inmediatamente y frustrando el ajuste fino.

**Solución**: Introduje flag `programaticoRef` en `WaveformEditor.tsx` que
marca cambios originados en código (flechas, "Marcar aquí", `aplicarSeleccion`)
para que el imán sepa ignorarlos. Solo el arrastrador manual de la región activa
el imán. Esto preserva:
- Arrastre manual: se imanta al beat si está activo.
- Flechas/botones: no son pisados por el imán.
- "Marcar aquí": se imanta al beat si está activo, pero el imán no lo rehace
  por ser programático.

## Persistencia y exportación (implementado)
- **IndexedDB, multi-proyecto nombrado** (implementado en el change
  `named-sessions`): cada proyecto recibe un ID generado y un nombre asignado
  por el usuario al primer guardado. El store `proyecto` admite múltiples
  entradas (clave = `snapshot.id`) y `archivos` usa la clave compuesta
  `${projectId}/${fileRef}` para aislar los archivos por sesión. DB_VERSION 2.
  Ver `features/persistence/projectStore.ts` y el change `named-sessions`.
- **Carga = re-decodificar**: al abrir un proyecto se vuelve a decodificar cada
  `File` a `AudioBuffer` y se repuebla el `trackStore`; luego se reemplaza el
  estado de los hooks (`reemplazarPistas/Bloques/Secuencia`).
- **Export WAV = render offline + encoder propio**: la mezcla se renderiza con
  `OfflineAudioContext` reutilizando el MISMO programador de fuentes que la
  reproducción en vivo (`programarPlan`, en `mixPlayer.ts`), así el WAV suena
  idéntico a lo que se oye. El `AudioBuffer` resultante se codifica a WAV PCM
  16-bit (`audio/wav.ts`, sin dependencias) y se descarga. MP3 (encoder WASM)
  queda para más adelante.

## Open questions
- ¿Detección de downbeats (compás) o solo beats en Fase 1? MVP: solo beats.
- Formatos de importación a garantizar (mp3/wav seguro; m4a/ogg/flac según
  soporte de `decodeAudioData` del navegador objetivo).
