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
import { getTrackObjectUrl } from '@/audio/trackStore';
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
  // Estado de reproducción de la selección en loop.
  const loopSelRef = useRef(false);

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
  useEffect(() => {
    loopSelRef.current = loopSel;
  }, [loopSel]);

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

    // Cabezal + control de límites del loop de selección.
    ws.on('timeupdate', (t: number) => {
      setCabezalSeg(t);
      const region = seleccionRef.current;
      if (loopSelRef.current && region && t >= region.end - 0.01) {
        ws.setTime(region.start);
      }
    });
    ws.on('play', () => setReproduciendo(true));
    ws.on('pause', () => setReproduciendo(false));
    ws.on('finish', () => setReproduciendo(false));

    return () => {
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
  const playPausaPista = () => {
    const ws = wsRef.current;
    if (!ws) return;
    setLoopSel(false);
    loopSelRef.current = false;
    ws.playPause();
  };
  const reproducirSeleccion = () => {
    const ws = wsRef.current;
    const region = seleccionRef.current;
    if (!ws || !region) return;
    setLoopSel(true);
    loopSelRef.current = true;
    ws.setTime(region.start);
    ws.play();
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
        <button onClick={reproducirSeleccion} disabled={!listo} aria-label="Loop de la selección">
          🔁 Loop selección
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
