# Spike: detección de BPM

Comparativa para elegir la librería de detección de BPM del MVP (tarea 1.3 /
pregunta abierta de `design.md`).

## Candidatas

| Librería | Versión | Tamaño (sin comprimir) | Deps | Último cambio | Entorno |
|---|---|---|---|---|---|
| **realtime-bpm-analyzer** | 5.0.15 | ~160 KB | 0 | 2026-06-18 (activísima) | Browser (AudioWorklet) + offline; testeable headless |
| web-audio-beat-detector | 8.2.36 | ~740 KB (con broker+worker) | 3 | 2026-03-19 (activa) | **Solo navegador**: acoplada a `Worker` + Blob URL |
| essentia.js | 0.1.3 | ~10 MB (WASM) | 1 | 2022-05-01 (estancada ~4 años) | Suite MIR completa; sobredimensionada para solo BPM |

## Prueba cuantitativa

Audio sintético con BPM **conocido** (patrón de batería kick/snare/hi-hat 4/4,
20 s, 44,1 kHz). No es música real, pero da un suelo objetivo y reproducible.

- `precision.mjs` — barrido de tempos (90–174 BPM).
- `robustez.mjs` — casos difíciles: jitter temporal, ruido de fondo, tempo no entero.

Ejecutar (requiere `node-web-audio-api` como polyfill de Web Audio en Node):

```bash
node spike/bpm/precision.mjs
node spike/bpm/robustez.mjs
```

### Resultados — precisión (realtime-bpm-analyzer)

Acierto **exacto** (Δ 0.0) en 90, 100, 120, 128, 140 y 174 BPM.

### Resultados — robustez (realtime-bpm-analyzer)

| Caso | Real | Estimado | Δ |
|---|---|---|---|
| limpio 120 | 120 | 120.0 | 0.0 |
| limpio 128 | 128 | 128.0 | 0.0 |
| no entero 123.5 | 123.5 | 124.0 | 0.5 (solo redondeo a entero) |
| jitter ±8 ms | 120 | 120.0 | 0.0 |
| jitter ±20 ms | 128 | 128.0 | 0.0 |
| ruido de fondo 0.15 | 120 | 120.0 | 0.0 |
| ruido de fondo 0.30 | 128 | 128.0 | 0.0 |
| jitter + ruido | 140 | 140.0 | 0.0 |

> **web-audio-beat-detector** no se pudo medir headless: instancia un `Worker`
> desde una Blob URL con código bundleado para navegador. Funciona en el
> navegador (su entorno objetivo), pero ese acoplamiento la hace incómoda de
> probar y la ata al runtime de browser. No se considera un defecto en la app,
> pero sí un punto en contra frente a una alternativa igual de pequeña y más
> flexible.

## Decisión

**realtime-bpm-analyzer**, por:

1. **Tamaño**: la más ligera de las tres y sin dependencias → bundle web ágil.
2. **Mantenimiento**: actualizada a diario (essentia.js lleva ~4 años parada).
3. **Flexibilidad**: ofrece API offline (`analyzeFullBuffer`, que usamos sobre
   los `AudioBuffer` ya decodificados) y tiempo real (AudioWorklet), útil para
   fases futuras.
4. **Precisión**: exacta en señal limpia y robusta a jitter y ruido en la prueba.

essentia.js queda descartada para el MVP (peso y abandono); podría reconsiderarse
en Fase 3 si se necesita MIR avanzado (separación/estructura), pero para BPM es
desproporcionada.

## Validación pendiente con música real

La prueba usa señal sintética. Antes de dar por cerrada la precisión conviene
validar con un puñado de canciones reales del usuario (géneros variados),
idealmente desde un pequeño harness en el navegador. Se deja como seguimiento
en el issue de Biblioteca (#2).
