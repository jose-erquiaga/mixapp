/**
 * Editor de pista: onda (wavesurfer) + rejilla de beats + reproducción para
 * marcar por oído + región de selección con imán al beat + creación de bloques.
 *
 * Flujo pensado para móvil: reproduces la pista, y cuando suena el punto justo
 * marcas "Inicio aquí" / "Fin aquí" (posición del cabezal). Afinas con las
 * flechas (±beat / ±fino) y con el loop de la selección. Cubre tareas 3.1–3.4.
 */

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { Track, Block } from '@/types/model';
import { getTrackObjectUrl, getTrackBuffer } from '@/audio/trackStore';
import { previsualizarRegion, type PreviewHandle } from '@/audio/preview';
import { tiemposBeats, imantarAlBeat, intervaloBeatSeg } from '@/audio/beats';
import './WaveformEditor.css';

export interface WaveformEditorProps {
  track: Track;
  bloques: Block[];
  color: string;
  onCrearBloque: (args: { etiqueta: string; inicioSeg: number; finSeg: number }) => void;
}

const COLOR_SELECCION = 'rgba(74, 158, 255, 0.25)';

export function WaveformEditor({ track, bloques, color, onCrearBloque }: WaveformEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const seleccionRef = useRef<Region | null>(null);
  const imanRef = useRef(true);
  // Marca de cambio programático (nudge/marcar): evita que el imán lo pise.
  const programaticoRef = useRef(false);
  // Loop de la selección: se reproduce con Web Audio nativo (sample-accurate,
  // sin el micro-silencio que dejaba el re-seek de wavesurfer).
  const loopHandleRef = useRef<PreviewHandle | null>(null);
  const rafLoopRef = useRef(0);

  const [iman, setIman] = useState(true);
  const [listo, setListo] = useState(false);
  const [etiqueta, setEtiqueta] = useState('');
  const [seleccion, setSeleccion] = useState<{ inicio: number; fin: number } | null>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [loopSel, setLoopSel] = useState(false);
  const [cabezalSeg, setCabezalSeg] = useState(0);

  useEffect(() => {
    imanRef.current = iman;
  }, [iman]);
  // Mantener los límites del loop en vivo cuando se ajusta la selección
  // (flechas, marcar por oído o arrastre): sin cortar el sonido.
  useEffect(() => {
    if (seleccion) loopHandleRef.current?.actualizarRegion(seleccion.inicio, seleccion.fin);
  }, [seleccion]);

  // Aplica una nueva selección de forma programática (sin que el imán la pise).
  const aplicarSeleccion = (inicio: number, fin: number) => {
    const region = seleccionRef.current;
    if (!region) return;
    const i = Math.max(0, Math.min(inicio, fin - 0.05));
    const f = Math.min(track.duracionSeg, Math.max(fin, i + 0.05));
    programaticoRef.current = true;
    region.setOptions({ start: i, end: f });
    setSeleccion({ inicio: i, fin: f });
  };

  // Crear/recrear wavesurfer cuando cambia la pista.
  useEffect(() => {
    const container = containerRef.current;
    const url = getTrackObjectUrl(track.fileRef);
    if (!container || !url) return;

    setListo(false);
    setSeleccion(null);
    setReproduciendo(false);
    setLoopSel(false);
    setCabezalSeg(0);

    const regions = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container,
      url,
      height: 96,
      waveColor: 'rgba(255,255,255,0.35)',
      progressColor: 'rgba(255,255,255,0.55)',
      cursorColor: '#fff',
      plugins: [regions],
    });
    wsRef.current = ws;

    ws.on('decode', () => {
      const finPorDefecto = Math.min(
        intervaloBeatSeg(track.bpm) * 8,
        track.duracionSeg / 4,
        track.duracionSeg,
      );
      const region = regions.addRegion({
        start: 0,
        end: finPorDefecto,
        color: COLOR_SELECCION,
        drag: true,
        resize: true,
      });
      seleccionRef.current = region;
      setSeleccion({ inicio: region.start, fin: region.end });
      setListo(true);
    });

    // Imán al beat: SOLO en arrastre manual; los cambios programáticos se respetan.
    regions.on('region-updated', (region) => {
      if (region !== seleccionRef.current) return;
      if (programaticoRef.current) {
        programaticoRef.current = false;
        setSeleccion({ inicio: region.start, fin: region.end });
        return;
      }
      if (imanRef.current) {
        const i = imantarAlBeat(region.start, track.bpm);
        const f = imantarAlBeat(region.end, track.bpm);
        if (Math.abs(i - region.start) > 1e-4 || Math.abs(f - region.end) > 1e-4) {
          programaticoRef.current = true;
          region.setOptions({ start: i, end: Math.max(f, i + 0.05) });
          setSeleccion({ inicio: i, fin: Math.max(f, i + 0.05) });
          return;
        }
      }
      setSeleccion({ inicio: region.start, fin: region.end });
    });

    // Cabezal durante la reproducción de la pista con wavesurfer.
    ws.on('timeupdate', (t: number) => setCabezalSeg(t));
    ws.on('play', () => setReproduciendo(true));
    ws.on('pause', () => setReproduciendo(false));
    ws.on('finish', () => setReproduciendo(false));

    return () => {
      // Parar el loop de Web Audio si estaba sonando.
      loopHandleRef.current?.stop();
      loopHandleRef.current = null;
      cancelAnimationFrame(rafLoopRef.current);
      ws.destroy();
      wsRef.current = null;
      seleccionRef.current = null;
    };
  }, [track.fileRef, track.bpm, track.duracionSeg]);

  const beatsPct = listo
    ? tiemposBeats(track.bpm, track.duracionSeg).map((t) => (t / track.duracionSeg) * 100)
    : [];

  const handleCrear = () => {
    if (!seleccion) return;
    const nombre = etiqueta.trim() || 'bloque';
    onCrearBloque({ etiqueta: nombre, inicioSeg: seleccion.inicio, finSeg: seleccion.fin });
    setEtiqueta('');
  };

  // Mover inicio o fin (las flechas funcionan siempre; el imán no las pisa).
  const ajustar = (cual: 'inicio' | 'fin', delta: number) => {
    if (!seleccion) return;
    if (cual === 'inicio') aplicarSeleccion(seleccion.inicio + delta, seleccion.fin);
    else aplicarSeleccion(seleccion.inicio, seleccion.fin + delta);
  };

  // Fijar inicio/fin en la posición actual del cabezal (marcar por oído).
  const marcarAqui = (cual: 'inicio' | 'fin') => {
    const ws = wsRef.current;
    if (!ws || !seleccion) return;
    let t = ws.getCurrentTime();
    if (imanRef.current) t = imantarAlBeat(t, track.bpm);
    if (cual === 'inicio') aplicarSeleccion(t, Math.max(seleccion.fin, t + 0.05));
    else aplicarSeleccion(Math.min(seleccion.inicio, t - 0.05), t);
  };

  // Transporte.
  const pararLoop = () => {
    loopHandleRef.current?.stop();
    loopHandleRef.current = null;
    cancelAnimationFrame(rafLoopRef.current);
    setLoopSel(false);
  };

  const playPausaPista = () => {
    const ws = wsRef.current;
    if (!ws) return;
    if (loopHandleRef.current) pararLoop(); // no sonar pista y loop a la vez
    ws.playPause();
  };

  // Loop sample-accurate de la selección con Web Audio (sin micro-silencio).
  // Vuelve a pulsar para detenerlo.
  const reproducirSeleccion = async () => {
    const ws = wsRef.current;
    const region = seleccionRef.current;
    if (!ws || !region) return;
    if (loopHandleRef.current) {
      pararLoop();
      return;
    }
    ws.pause(); // que no suene la pista a la vez
    const buffer = getTrackBuffer(track.fileRef);
    if (!buffer) return;
    const handle = await previsualizarRegion(buffer, region.start, region.end, undefined, {
      loop: true,
    });
    loopHandleRef.current = handle;
    setLoopSel(true);
    // Cabezal vivo: lo movemos según el reloj del AudioContext.
    const animar = () => {
      const h = loopHandleRef.current;
      if (!h) return;
      const pos = h.posicionSeg();
      setCabezalSeg(pos);
      wsRef.current?.setTime(pos);
      rafLoopRef.current = requestAnimationFrame(animar);
    };
    rafLoopRef.current = requestAnimationFrame(animar);
  };

  const beat = intervaloBeatSeg(track.bpm);

  return (
    <div className="wf-editor">
      <div className="wf-editor__head">
        <span className="wf-editor__track" style={{ color }}>
          {track.nombre}
        </span>
        <span className="wf-editor__bpm">
          {cabezalSeg.toFixed(2)}s · {track.bpm} BPM
        </span>
      </div>

      <div className="wf-editor__canvas">
        <div ref={containerRef} className="wf-editor__wave" />
        <div className="wf-editor__grid" aria-hidden>
          {beatsPct.map((pct, i) => (
            <div
              key={i}
              className={`wf-editor__beat ${i % 4 === 0 ? 'wf-editor__beat--compas' : ''}`}
              style={{ left: `${pct}%` }}
            />
          ))}
        </div>
      </div>

      {/* Transporte: oír la pista y marcar por oído. */}
      <div className="wf-editor__transport">
        <button onClick={playPausaPista} disabled={!listo} aria-label="Reproducir pista">
          {reproduciendo && !loopSel ? '⏸' : '▶'} Pista
        </button>
        <button
          onClick={reproducirSeleccion}
          disabled={!listo}
          aria-label="Loop de la selección"
          className={loopSel ? 'wf-editor__marcar' : ''}
        >
          {loopSel ? '⏹ Parar loop' : '🔁 Loop selección'}
        </button>
        <button className="wf-editor__marcar" onClick={() => marcarAqui('inicio')} disabled={!listo}>
          ⇤ Inicio aquí
        </button>
        <button className="wf-editor__marcar" onClick={() => marcarAqui('fin')} disabled={!listo}>
          Fin aquí ⇥
        </button>
      </div>

      {/* Ajuste fino de inicio y fin. */}
      <div className="wf-editor__nudge">
        <div className="wf-editor__nudge-row">
          <span className="wf-editor__nudge-label">Inicio</span>
          <button onClick={() => ajustar('inicio', -beat)} disabled={!listo} aria-label="Inicio −1 beat">
            ⏮
          </button>
          <button onClick={() => ajustar('inicio', -0.05)} disabled={!listo} aria-label="Inicio fino −">
            −
          </button>
          <span className="wf-editor__nudge-val">{seleccion ? seleccion.inicio.toFixed(2) : '—'}s</span>
          <button onClick={() => ajustar('inicio', 0.05)} disabled={!listo} aria-label="Inicio fino +">
            +
          </button>
          <button onClick={() => ajustar('inicio', beat)} disabled={!listo} aria-label="Inicio +1 beat">
            ⏭
          </button>
        </div>
        <div className="wf-editor__nudge-row">
          <span className="wf-editor__nudge-label">Fin</span>
          <button onClick={() => ajustar('fin', -beat)} disabled={!listo} aria-label="Fin −1 beat">
            ⏮
          </button>
          <button onClick={() => ajustar('fin', -0.05)} disabled={!listo} aria-label="Fin fino −">
            −
          </button>
          <span className="wf-editor__nudge-val">{seleccion ? seleccion.fin.toFixed(2) : '—'}s</span>
          <button onClick={() => ajustar('fin', 0.05)} disabled={!listo} aria-label="Fin fino +">
            +
          </button>
          <button onClick={() => ajustar('fin', beat)} disabled={!listo} aria-label="Fin +1 beat">
            ⏭
          </button>
        </div>
      </div>

      <div className="wf-editor__controls">
        <label className="wf-editor__iman">
          <input type="checkbox" checked={iman} onChange={(e) => setIman(e.target.checked)} />
          Imán al beat
        </label>

        <input
          className="wf-editor__etiqueta"
          type="text"
          placeholder="Etiqueta (intro, estribillo…)"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
        />
        <button className="wf-editor__crear" onClick={handleCrear} disabled={!listo || !seleccion}>
          Crear bloque
        </button>
      </div>

      <p className="wf-editor__cuenta">{bloques.length} bloque(s) en esta pista</p>
    </div>
  );
}
