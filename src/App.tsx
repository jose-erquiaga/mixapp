import { useState } from 'react';
import { Track } from '@/types/model';
import { AudioContextProvider } from '@/audio/AudioContextProvider';
import { LibraryPanel } from '@/features/library/LibraryPanel';
import './App.css';

/**
 * Layout raíz de MIXAPP. Integra las capabilities del MVP:
 *  - Biblioteca (library): importar pistas
 *  - Editor de pista (waveform-editor): marcar bloques (pendiente)
 *  - Lienzo de mezcla + reproducción (mix-canvas / playback): pendiente
 */
function AppContent() {
  const [pistaSeleccionada, setPistaSeleccionada] = useState<Track | null>(null);

  return (
    <div className="app">
      <header className="app__header">
        <h1>MIXAPP</h1>
        <p className="app__tagline">Arma tu mezcla por bloques, en tu navegador.</p>
      </header>

      <main className="app__layout">
        <section className="panel" aria-label="Biblioteca">
          <h2>Biblioteca</h2>
          <LibraryPanel onSelectTrack={setPistaSeleccionada} />
        </section>

        <section className="panel" aria-label="Editor de pista">
          <h2>Editor de pista</h2>
          {pistaSeleccionada ? (
            <p className="panel__info">
              Seleccionada: <strong>{pistaSeleccionada.nombre}</strong> ({pistaSeleccionada.bpm} BPM)
            </p>
          ) : (
            <p className="panel__placeholder">Selecciona una pista para marcar bloques.</p>
          )}
        </section>

        <section className="panel panel--wide" aria-label="Lienzo de mezcla">
          <h2>Lienzo de mezcla</h2>
          <p className="panel__placeholder">Arrastra bloques aquí para secuenciar la mezcla.</p>
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
