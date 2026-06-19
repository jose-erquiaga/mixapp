import { useState } from 'react';
import { AudioContextProvider } from '@/audio/AudioContextProvider';
import { LibraryPanel } from '@/features/library/LibraryPanel';
import { useLibrary } from '@/features/library/useLibrary';
import { EditorPanel } from '@/features/waveform-editor/EditorPanel';
import { useBlocks } from '@/features/waveform-editor/useBlocks';
import './App.css';

/**
 * Layout raíz de MIXAPP. Orquesta el estado compartido (biblioteca y bloques)
 * y lo reparte entre las capabilities del MVP:
 *  - Biblioteca (library): importar pistas
 *  - Editor de pista (waveform-editor): marcar bloques
 *  - Lienzo de mezcla + reproducción (mix-canvas / playback): pendiente
 */
function AppContent() {
  const library = useLibrary();
  const blocks = useBlocks();
  const [trackSeleccionadoId, setTrackSeleccionadoId] = useState<string | null>(null);

  // Derivar la pista activa de la lista para que los cambios (p. ej. BPM) se reflejen.
  const pistaActiva = library.pistas.find((p) => p.id === trackSeleccionadoId) ?? null;
  const bloquesActivos = pistaActiva ? blocks.bloquesDePista(pistaActiva.id) : [];

  return (
    <div className="app">
      <header className="app__header">
        <h1>MIXAPP</h1>
        <p className="app__tagline">Arma tu mezcla por bloques, en tu navegador.</p>
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
          <p className="panel__placeholder">
            Arrastra bloques aquí para secuenciar la mezcla. ({blocks.bloques.length} bloque(s)
            disponibles)
          </p>
        </section>
      </main>
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
