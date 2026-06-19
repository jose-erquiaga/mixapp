/**
 * Hook de transporte de reproducción de la mezcla (capability playback).
 * Reconstruye el plan cuando cambia la secuencia o el BPM de las pistas.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { SequencedBlock, Track } from '@/types/model';
import { MixPlayer, construirPlan } from '@/audio/mixPlayer';

export interface PlaybackState {
  posSeg: number;
  totalSeg: number;
  reproduciendo: boolean;
  iniciosBloque: number[];
  play: () => void;
  pause: () => void;
  saltarABloque: (index: number) => void;
}

export function usePlayback(secuencia: SequencedBlock[], tracks: Track[]): PlaybackState {
  const [posSeg, setPosSeg] = useState(0);
  const [totalSeg, setTotalSeg] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);

  const playerRef = useRef<MixPlayer | null>(null);
  if (!playerRef.current) {
    playerRef.current = new MixPlayer({
      onProgress: (pos, total) => {
        setPosSeg(pos);
        setTotalSeg(total);
      },
      onEnded: () => setReproduciendo(false),
    });
  }

  // Mapa estable trackId → bpm.
  const bpmPorPista = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tracks) m.set(t.id, t.bpm);
    return m;
  }, [tracks]);

  const plan = useMemo(
    () => construirPlan(secuencia, (id) => bpmPorPista.get(id) ?? 120),
    [secuencia, bpmPorPista],
  );

  // Cargar el plan en el reproductor cuando cambie.
  useEffect(() => {
    playerRef.current?.cargar(plan);
    setReproduciendo(false);
    setPosSeg(0);
    setTotalSeg(plan.totalSeg);
  }, [plan]);

  // Parar al desmontar.
  useEffect(() => {
    const player = playerRef.current;
    return () => player?.detener();
  }, []);

  return {
    posSeg,
    totalSeg,
    reproduciendo,
    iniciosBloque: plan.iniciosBloque,
    play: () => {
      playerRef.current?.play();
      setReproduciendo(true);
    },
    pause: () => {
      playerRef.current?.pause();
      setReproduciendo(false);
    },
    saltarABloque: (index: number) => playerRef.current?.saltarABloque(index),
  };
}
