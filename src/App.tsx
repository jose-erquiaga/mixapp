import { useState, useCallback } from 'react';
import { AudioContextProvider } from '@/audio/AudioContextProvider';
import { LibraryPanel } from '@/features/library/LibraryPanel';
import { useLibrary } from '@/features/library/useLibrary';
import { EditorPanel } from '@/features/waveform-editor/EditorPanel';
import { useBlocks } from '@/features/waveform-editor/useBlocks';
import { MixCanvasPanel } from '@/features/mix-canvas/MixCanvasPanel';
import { useMixCanvas } from '@/features/mix-canvas/useMixCanvas';
import { PlaybackBar } from '@/features/playback/PlaybackBar';
import { usePlayback } from '@/features/playback/usePlayback';
import { PersistencePanel } from '@/features/persistence/PersistencePanel';
import { usePersistence } from '@/features/persistence/usePersistence';
import { ProjectNameModal } from '@/features/persistence/ProjectNameModal';
import { ProjectListModal } from '@/features/persistence/ProjectListModal';
import { useLocalLibrary } from '@/features/local-library/useLocalLibrary';
import { LocalLibraryModal } from '@/features/local-library/LocalLibraryModal';
import { obtenerCancion } from '@/features/local-library/libraryStore';
import { useInstallPrompt } from '@/features/install/useInstallPrompt';
import './App.css';

function AppContent() {
  const blocks = useBlocks();

  const onImportado = useCallback(
    async (id: string) => {
      try {
        const cancion = await obtenerCancion(id);
        if (cancion && cancion.bloques.length > 0) {
          blocks.mergeBloques(cancion.bloques);
        }
      } catch {
        // silencioso: re-vincular es best-effort
      }
    },
    [blocks.mergeBloques],
  );

  const library = useLibrary({ onImportado });
  const canvas = useMixCanvas();
  const playback = usePlayback(canvas.secuencia, library.pistas);
  const persistence = usePersistence({
    pistas: library.pistas,
    bloques: blocks.bloques,
    secuencia: canvas.secuencia,
    plan: playback.plan,
    reemplazarPistas: library.reemplazarPistas,
    reemplazarBloques: blocks.reemplazarBloques,
    reemplazarSecuencia: canvas.reemplazarSecuencia,
  });
  const localLib = useLocalLibrary({
    pistas: library.pistas,
    bloques: blocks.bloques,
    onAnadirPista: library.anadirPista,
    onMergeBloques: blocks.mergeBloques,
  });
  const install = useInstallPrompt();
  const [trackSeleccionadoId, setTrackSeleccionadoId] = useState<string | null>(null);

  const pistaActiva = library.pistas.find((p) => p.id === trackSeleccionadoId) ?? null;
  const bloquesActivos = pistaActiva ? blocks.bloquesDePista(pistaActiva.id) : [];

  return (
    <div className="app">
      <header className="app__header">
        <h1>MIXAPP</h1>
        <p className="app__tagline">Arma tu mezcla por bloques, en tu navegador.</p>
        {install.puedeInstalar && (
          <button className="app__instalar" onClick={install.instalar}>
            ⬇ Instalar app
          </button>
        )}
        <PersistencePanel
          ocupado={persistence.ocupado}
          estado={persistence.estado}
          hayGuardado={persistence.hayGuardado}
          puedeGuardar={library.pistas.length > 0}
          puedeExportar={canvas.secuencia.length > 0}
          nombreProyectoActual={persistence.nombreProyectoActual}
          onGuardar={persistence.guardar}
          onCargar={persistence.cargar}
          onExportar={persistence.exportarWav}
          bibliotecaOcupado={localLib.ocupado}
          bibliotecaEstado={localLib.estado}
          puedeGuardarBiblioteca={library.pistas.length > 0}
          onGuardarBiblioteca={localLib.guardarEnBiblioteca}
          onAbrirBiblioteca={localLib.abrirModal}
          hayBiblioteca={localLib.hayBiblioteca}
        />
      </header>

      <main className="app__layout">
        <section className="panel" aria-label="Biblioteca">
          <h2>Biblioteca</h2>
          <LibraryPanel
            pistas={library.pistas}
            importando={library.importando}
            error={library.error}
            onImportar={library.importarArchivos}
            onBpmChange={library.actualizarBpm}
            onEliminar={(id) => {
              if (id === trackSeleccionadoId) setTrackSeleccionadoId(null);
              library.eliminarPista(id);
            }}
            onLimpiarError={library.limpiarError}
            onSelectTrack={(t) => setTrackSeleccionadoId(t.id)}
            trackSeleccionadoId={trackSeleccionadoId ?? undefined}
            bloquesDePista={blocks.bloquesDePista}
            onAnadirBloque={canvas.anadirBloque}
          />
        </section>

        <section className="panel" aria-label="Editor de pista">
          <h2>Editor de pista</h2>
          {pistaActiva ? (
            <EditorPanel
              track={pistaActiva}
              bloques={bloquesActivos}
              onCrearBloque={(b) => blocks.crearBloque(b)}
              onActualizarBloque={blocks.actualizarBloque}
              onEliminarBloque={blocks.eliminarBloque}
            />
          ) : (
            <p className="panel__placeholder">Selecciona una pista para marcar bloques.</p>
          )}
        </section>

        <section className="panel panel--wide" aria-label="Lienzo de mezcla">
          <h2>Lienzo de mezcla</h2>
          <PlaybackBar
            secuencia={canvas.secuencia}
            posSeg={playback.posSeg}
            totalSeg={playback.totalSeg}
            reproduciendo={playback.reproduciendo}
            iniciosBloque={playback.iniciosBloque}
            onPlay={playback.play}
            onPause={playback.pause}
            onSaltar={playback.saltarABloque}
          />
          <MixCanvasPanel
            tracks={library.pistas}
            secuencia={canvas.secuencia}
            onQuitar={canvas.quitarEnIndice}
            onMover={canvas.moverBloque}
            onCambiarTransicion={canvas.cambiarTransicion}
          />
        </section>
      </main>

      <ProjectNameModal
        abierto={persistence.modalNombre.abierto}
        onConfirmar={persistence.modalNombre.onConfirmar}
        onCancelar={persistence.modalNombre.onCancelar}
      />

      <ProjectListModal
        abierto={persistence.modalLista.abierto}
        proyectos={persistence.proyectos}
        ocupado={persistence.ocupado}
        onSeleccionar={persistence.modalLista.onSeleccionar}
        onEliminar={persistence.modalLista.onEliminar}
        onCerrar={persistence.modalLista.onCerrar}
      />

      <LocalLibraryModal
        abierto={localLib.modalAbierto}
        ocupado={localLib.ocupado}
        onCerrar={localLib.cerrarModal}
        onCargar={localLib.cargarDesdeBiblioteca}
        onEliminar={localLib.eliminarDeBiblioteca}
      />
    </div>
  );
}

function App() {
  return (
    <AudioContextProvider>
      <AppContent />
    </AudioContextProvider>
  );
}

export default App;
