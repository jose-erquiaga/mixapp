# Tasks

## 1. Scaffold del proyecto
- [x] 1.1 Crear proyecto React + Vite + TypeScript
- [x] 1.2 Configurar lint/format y estructura de carpetas
- [x] 1.3 Añadir wavesurfer.js y librería de BPM (tras spike)

## 2. Biblioteca (capability: library)
- [x] 2.1 Importar archivos por arrastre y selector
- [x] 2.2 Decodificar con Web Audio (decodeAudioData) y validar formato
- [x] 2.3 Detectar BPM y duración; permitir edición manual del BPM
- [x] 2.4 Listar pistas importadas con su BPM/duración

## 3. Editor de pista (capability: waveform-editor)
- [x] 3.1 Renderizar onda con wavesurfer.js
- [x] 3.2 Dibujar rejilla de beats a partir del BPM
- [x] 3.3 Marcas de inicio/fin con imán al beat (toggle on/off)
- [x] 3.4 Crear bloque etiquetado desde la región marcada
- [x] 3.5 Editar/eliminar bloque y previsualizar la región
- [x] 3.6 Reproducción integrada + marcar por oído + loop sin cortes

## 4. Lienzo de mezcla (capability: mix-canvas)
- [x] 4.1 Arrastrar bloques a una secuencia ordenada (móvil-first: botón "Añadir")
- [x] 4.2 Reordenar y eliminar bloques de la secuencia
- [x] 4.3 Selector de transición por unión (corte/crossfade/ajuste BPM)
- [x] 4.4 Color por canción en cada bloque

## 5. Reproducción (capability: playback)
- [x] 5.1 Programar la secuencia con Web Audio (gapless)
- [x] 5.2 Aplicar transiciones (crossfade con GainNode, ajuste BPM)
- [x] 5.3 Play/pause, cabezal en movimiento y salto a bloque

## 6. Persistencia y exportación (capability: project-persistence)
- [x] 6.1 Guardar/cargar proyecto en IndexedDB
- [x] 6.2 Render offline de la mezcla (OfflineAudioContext)
- [x] 6.3 Exportar a WAV y descargar
