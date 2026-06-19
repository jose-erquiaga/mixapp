# Tasks

## 1. Scaffold del proyecto
- [ ] 1.1 Crear proyecto React + Vite + TypeScript
- [ ] 1.2 Configurar lint/format y estructura de carpetas
- [ ] 1.3 Añadir wavesurfer.js y librería de BPM (tras spike)

## 2. Biblioteca (capability: library)
- [ ] 2.1 Importar archivos por arrastre y selector
- [ ] 2.2 Decodificar con Web Audio (decodeAudioData) y validar formato
- [ ] 2.3 Detectar BPM y duración; permitir edición manual del BPM
- [ ] 2.4 Listar pistas importadas con su BPM/duración

## 3. Editor de pista (capability: waveform-editor)
- [ ] 3.1 Renderizar onda con wavesurfer.js
- [ ] 3.2 Dibujar rejilla de beats a partir del BPM
- [ ] 3.3 Marcas de inicio/fin con imán al beat (toggle on/off)
- [ ] 3.4 Crear bloque etiquetado desde la región marcada
- [ ] 3.5 Editar/eliminar bloque y previsualizar la región

## 4. Lienzo de mezcla (capability: mix-canvas)
- [ ] 4.1 Arrastrar bloques a una secuencia ordenada
- [ ] 4.2 Reordenar y eliminar bloques de la secuencia
- [ ] 4.3 Selector de transición por unión (corte/crossfade/ajuste BPM)
- [ ] 4.4 Color por canción en cada bloque

## 5. Reproducción (capability: playback)
- [ ] 5.1 Programar la secuencia con Web Audio (gapless)
- [ ] 5.2 Aplicar transiciones (crossfade con GainNode, ajuste BPM)
- [ ] 5.3 Play/pause, cabezal en movimiento y salto a bloque

## 6. Persistencia y exportación (capability: project-persistence)
- [ ] 6.1 Guardar/cargar proyecto en IndexedDB
- [ ] 6.2 Render offline de la mezcla (OfflineAudioContext)
- [ ] 6.3 Exportar a WAV y descargar
