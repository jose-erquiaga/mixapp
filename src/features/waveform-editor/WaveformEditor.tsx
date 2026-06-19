/**
 * Editor de pista: onda (wavesurfer) + rejilla de beats + región de selección
 * con imán al beat + creación de bloques etiquetados.
 *
 * Cubre tareas 3.1–3.4. El listado de bloques con previsualización/edición
 * vive en BlockList (3.5).
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
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const seleccionRef = useRef<Region | null>(null);
  const imanRef = useRef(true);

  const [iman, setIman] = useState(true);
  const [listo, setListo] = useState(false);
  const [etiqueta, setEtiqueta] = useState('');
  const [seleccion, setSeleccion] = useState<{ inicio: number; fin: number } | null>(null);

  // Mantener el ref del imán sincronizado para leerlo dentro de los listeners.
  useEffect(() => {
    imanRef.current = iman;
  }, [iman]);

  // Crear/recrear wavesurfer cuando cambia la pista.
  useEffect(() => {
    const container = containerRef.current;
    const url = getTrackObjectUrl(track.fileRef);
    if (!container || !url) return;

    setListo(false);
    setSeleccion(null);

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
    regionsRef.current = regions;

    ws.on('decode', () => {
      // Selección inicial: primeros 8 beats (o 1/4 de la pista si es más corta).
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

    // Imán al beat: al terminar de mover/redimensionar la selección.
    regions.on('region-updated', (region) => {
      if (region !== seleccionRef.current) return;
      if (imanRef.current) {
        const inicioIman = imantarAlBeat(region.start, track.bpm);
        const finIman = imantarAlBeat(region.end, track.bpm);
        // Evitar bucle: solo reescribir si cambió de forma apreciable.
        if (Math.abs(inicioIman - region.start) > 1e-4 || Math.abs(finIman - region.end) > 1e-4) {
          region.setOptions({ start: inicioIman, end: Math.max(finIman, inicioIman + 0.05) });
          return;
        }
      }
      setSeleccion({ inicio: region.start, fin: region.end });
    });

    return () => {
      ws.destroy();
      wsRef.current = null;
      regionsRef.current = null;
      seleccionRef.current = null;
    };
  }, [track.fileRef, track.bpm, track.duracionSeg]);

  // Rejilla de beats como porcentajes (escala con el ancho del contenedor).
  const beatsPct = listo
    ? tiemposBeats(track.bpm, track.duracionSeg).map((t) => (t / track.duracionSeg) * 100)
    : [];

  const handleCrear = () => {
    if (!seleccion) return;
    const nombre = etiqueta.trim() || 'bloque';
    onCrearBloque({ etiqueta: nombre, inicioSeg: seleccion.inicio, finSeg: seleccion.fin });
    setEtiqueta('');
  };

  // Ajuste por toques (móvil-first): mover inicio o fin sin arrastrar.
  const ajustar = (cual: 'inicio' | 'fin', delta: number) => {
    const region = seleccionRef.current;
    if (!region) return;
    let { start: inicio, end: fin } = region;
    if (cual === 'inicio') {
      inicio = Math.max(0, Math.min(inicio + delta, fin - 0.05));
    } else {
      fin = Math.min(track.duracionSeg, Math.max(fin + delta, inicio + 0.05));
    }
    region.setOptions({ start: inicio, end: fin });
    setSeleccion({ inicio, fin });
  };

  const beat = intervaloBeatSeg(track.bpm);

  return (
    <div className="wf-editor">
      <div className="wf-editor__head">
        <span className="wf-editor__track" style={{ color }}>
          {track.nombre}
        </span>
        <span className="wf-editor__bpm">{track.bpm} BPM</span>
      </div>

      <div className="wf-editor__canvas">
        <div ref={containerRef} className="wf-editor__wave" />
        {/* Rejilla de beats superpuesta */}
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

      {/* Ajuste por toques de inicio y fin (móvil-first). */}
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
