import './App.css';

/**
 * Layout raíz de MIXAPP. De momento es un esqueleto con las tres zonas que
 * irá poblando cada capability del MVP:
 *  - Biblioteca (library)
 *  - Editor de pista (waveform-editor)
 *  - Lienzo de mezcla + reproducción (mix-canvas / playback)
 */
function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>MIXAPP</h1>
        <p className="app__tagline">Arma tu mezcla por bloques, en tu navegador.</p>
      </header>

      <main className="app__layout">
        <section className="panel" aria-label="Biblioteca">
          <h2>Biblioteca</h2>
          <p className="panel__placeholder">Importa tus canciones para empezar.</p>
        </section>

        <section className="panel" aria-label="Editor de pista">
          <h2>Editor de pista</h2>
          <p className="panel__placeholder">Selecciona una pista para marcar bloques.</p>
        </section>

        <section className="panel panel--wide" aria-label="Lienzo de mezcla">
          <h2>Lienzo de mezcla</h2>
          <p className="panel__placeholder">Arrastra bloques aquí para secuenciar la mezcla.</p>
        </section>
      </main>
    </div>
  );
}

export default App;
