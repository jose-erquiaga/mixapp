## Why
No existe todavía nada de MIXAPP. La Fase 1 entrega el alma del producto: un
constructor de mezclas por bloques, simple y lúdico, que funciona 100% en el
navegador con los archivos del propio usuario, sin depender de catálogos
externos ni de IA.

## What Changes
- Importación de archivos de audio locales con detección automática de BPM.
- Editor de pista: onda con rejilla de beats, marcado de secciones con imán al
  beat y creación de "bloques" etiquetados.
- Lienzo de mezcla: secuenciar bloques en una línea por arrastre y elegir la
  transición entre cada par.
- Reproducción encadenada y sin cortes de la mezcla completa.
- Guardar/cargar proyecto en local y exportar la mezcla a WAV.

## Impact
- Specs nuevas (ADDED): `library`, `waveform-editor`, `mix-canvas`, `playback`,
  `project-persistence`.
- Código: proyecto nuevo React + Vite + TS desde cero.
- Fuera de alcance: multi-canal/loops (Fase 2), separación de stems (Fase 3),
  cualquier integración con streaming.
