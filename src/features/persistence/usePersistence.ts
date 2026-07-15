import { useCallback, useEffect, useRef, useState } from 'react';
import { Track, Block, SequencedBlock } from '@/types/model';
import { decodificarArchivo } from '@/audio/decode';
import { putTrackAudio, getTrackFile } from '@/audio/trackStore';
import { renderMixToBuffer, type PlanMezcla } from '@/audio/mixPlayer';
import { audioBufferToWav } from '@/audio/wav';
import {
  guardarProyecto,
  cargarProyecto,
  listarProyectos,
  eliminarProyecto,
  hayAlgunProyecto,
  generarIdProyecto,
  type ProjectSnapshot,
} from './projectStore';
import { obtenerCancion } from '@/features/local-library/libraryStore';

export interface PersistenceDeps {
  pistas: Track[];
  bloques: Block[];
  secuencia: SequencedBlock[];
  plan: PlanMezcla;
  reemplazarPistas: (pistas: Track[]) => void;
  reemplazarBloques: (bloques: Block[]) => void;
  reemplazarSecuencia: (secuencia: SequencedBlock[]) => void;
}

export interface ModalNombre {
  abierto: boolean;
  onConfirmar: (nombre: string) => void;
  onCancelar: () => void;
}

export interface ModalLista {
  abierto: boolean;
  onSeleccionar: (id: string) => void;
  onEliminar: (id: string) => void;
  onCerrar: () => void;
}

export interface PersistenceState {
  ocupado: boolean;
  estado: string | null;
  hayGuardado: boolean;
  nombreProyectoActual: string;
  proyectos: ProjectSnapshot[];
  guardar: () => void;
  cargar: () => Promise<void>;
  exportarWav: () => Promise<void>;
  modalNombre: ModalNombre;
  modalLista: ModalLista;
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function usePersistence(deps: PersistenceDeps): PersistenceState {
  const {
    pistas,
    bloques,
    secuencia,
    plan,
    reemplazarPistas,
    reemplazarBloques,
    reemplazarSecuencia,
  } = deps;

  const [ocupado, setOcupado] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [hayGuardado, setHayGuardado] = useState(false);
  const [proyectos, setProyectos] = useState<ProjectSnapshot[]>([]);
  const [proyectoActualId, setProyectoActualId] = useState<string | null>(null);
  const [nombreProyectoActual, setNombreProyectoActual] = useState('');
  const [modalNombreAbierto, setModalNombreAbierto] = useState(false);
  const [modalListaAbierta, setModalListaAbierta] = useState(false);

  // Refs para acceder a valores actuales desde callbacks sin recrearlos.
  const pistasRef = useRef(pistas);
  const bloquesRef = useRef(bloques);
  const secuenciaRef = useRef(secuencia);
  pistasRef.current = pistas;
  bloquesRef.current = bloques;
  secuenciaRef.current = secuencia;

  useEffect(() => {
    hayAlgunProyecto()
      .then(setHayGuardado)
      .catch(() => setHayGuardado(false));
  }, []);

  const refrescarLista = useCallback(async () => {
    const lista = await listarProyectos();
    setProyectos(lista);
    setHayGuardado(lista.length > 0);
  }, []);

  const _guardarConId = useCallback(async (id: string, nombre: string) => {
    setOcupado(true);
    setEstado('Guardando…');
    try {
      const archivos: Record<string, File> = {};
      for (const pista of pistasRef.current) {
        const enBiblioteca = await obtenerCancion(pista.id).catch(() => undefined);
        if (enBiblioteca) continue;
        const file = getTrackFile(pista.fileRef);
        if (file) archivos[pista.fileRef] = file;
      }
      const snapshot: ProjectSnapshot = {
        id,
        nombre,
        version: 1,
        guardadoEn: Date.now(),
        tracks: pistasRef.current,
        bloques: bloquesRef.current,
        secuencia: secuenciaRef.current,
      };
      await guardarProyecto(snapshot, archivos);
      setProyectoActualId(id);
      setNombreProyectoActual(nombre);
      await refrescarLista();
      setEstado(`"${nombre}" guardado ✓`);
    } catch (err) {
      setEstado(`Error al guardar: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setOcupado(false);
    }
  }, [refrescarLista]);

  const confirmarNombre = useCallback(
    (nombre: string) => {
      setModalNombreAbierto(false);
      const id = proyectoActualId ?? generarIdProyecto();
      _guardarConId(id, nombre.trim() || 'Mi mezcla');
    },
    [proyectoActualId, _guardarConId],
  );

  const guardar = useCallback(() => {
    if (pistasRef.current.length === 0) {
      setEstado('No hay nada que guardar todavia.');
      return;
    }
    if (proyectoActualId && nombreProyectoActual) {
      // Overwrite silencioso si ya tiene nombre.
      _guardarConId(proyectoActualId, nombreProyectoActual);
    } else {
      setModalNombreAbierto(true);
    }
  }, [proyectoActualId, nombreProyectoActual, _guardarConId]);

  const cargar = useCallback(async () => {
    await refrescarLista();
    setModalListaAbierta(true);
  }, [refrescarLista]);

  const seleccionarProyecto = useCallback(
    async (id: string) => {
      setModalListaAbierta(false);
      setOcupado(true);
      setEstado('Cargando…');
      try {
        const datos = await cargarProyecto(id);
        if (!datos) {
          setEstado('No se encontro el proyecto.');
          return;
        }
        const { snapshot, archivos } = datos;
        for (const track of snapshot.tracks) {
          let file = archivos[track.fileRef];
          if (!file) {
            const cancion = await obtenerCancion(track.id).catch(() => undefined);
            if (cancion) file = cancion.file;
          }
          if (!file) continue;
          const buffer = await decodificarArchivo(file);
          putTrackAudio(track.fileRef, file, buffer);
        }
        reemplazarPistas(snapshot.tracks);
        reemplazarBloques(snapshot.bloques);
        reemplazarSecuencia(snapshot.secuencia);
        setProyectoActualId(snapshot.id);
        setNombreProyectoActual(snapshot.nombre);
        setEstado(`"${snapshot.nombre}" cargado ✓`);
      } catch (err) {
        setEstado(`Error al cargar: ${err instanceof Error ? err.message : 'desconocido'}`);
      } finally {
        setOcupado(false);
      }
    },
    [reemplazarPistas, reemplazarBloques, reemplazarSecuencia],
  );

  const eliminarProyectoGuardado = useCallback(
    async (id: string) => {
      await eliminarProyecto(id);
      if (id === proyectoActualId) {
        setProyectoActualId(null);
        setNombreProyectoActual('');
      }
      await refrescarLista();
    },
    [proyectoActualId, refrescarLista],
  );

  const exportarWav = useCallback(async () => {
    if (secuenciaRef.current.length === 0) {
      setEstado('Añade bloques a la secuencia antes de exportar.');
      return;
    }
    setOcupado(true);
    setEstado('Renderizando mezcla…');
    try {
      const buffer = await renderMixToBuffer(plan);
      if (!buffer) {
        setEstado('No hay mezcla que exportar.');
        return;
      }
      const blob = audioBufferToWav(buffer);
      descargarBlob(blob, `${nombreProyectoActual || 'mezcla'}.wav`);
      setEstado('Mezcla exportada a WAV ✓');
    } catch (err) {
      setEstado(`Error al exportar: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setOcupado(false);
    }
  }, [plan, nombreProyectoActual]);

  return {
    ocupado,
    estado,
    hayGuardado,
    nombreProyectoActual,
    proyectos,
    guardar,
    cargar,
    exportarWav,
    modalNombre: {
      abierto: modalNombreAbierto,
      onConfirmar: confirmarNombre,
      onCancelar: () => setModalNombreAbierto(false),
    },
    modalLista: {
      abierto: modalListaAbierta,
      onSeleccionar: seleccionarProyecto,
      onEliminar: eliminarProyectoGuardado,
      onCerrar: () => setModalListaAbierta(false),
    },
  };
}
