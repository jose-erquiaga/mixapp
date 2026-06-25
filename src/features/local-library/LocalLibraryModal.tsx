/**
 * Vista de biblioteca local a pantalla completa (issue #11).
 *
 * Lista las canciones guardadas con nombre, BPM, duración y nº de bloques.
 * Cada fila ofrece "Cargar" (trae canción + bloques al workspace) y "Eliminar".
 */

import { useEffect, useState } from 'react';
import { CancionGuardada, cargarBiblioteca } from './libraryStore';
import './LocalLibraryModal.css';

export interface LocalLibraryModalProps {
  abierto: boolean;
  ocupado: boolean;
  onCerrar: () => void;
  onCargar: (cancion: CancionGuardada) => void;
  onEliminar: (id: string) => void;
}

function formatDuracion(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function LocalLibraryModal({
  abierto,
  ocupado,
  onCerrar,
  onCargar,
  onEliminar,
}: LocalLibraryModalProps) {
  const [canciones, setCanciones] = useState<CancionGuardada[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCargando(true);
    cargarBiblioteca()
      .then(setCanciones)
      .catch(() => setCanciones([]))
      .finally(() => setCargando(false));
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="biblio-modal" role="dialog" aria-label="Biblioteca local">
      <div className="biblio-modal__contenido">
        <header className="biblio-modal__cabecera">
          <h2>Biblioteca local</h2>
          <button className="biblio-modal__cerrar" onClick={onCerrar}>
            ✕
          </button>
        </header>

        {cargando && <p className="biblio-modal__vacio">Cargando…</p>}

        {!cargando && canciones.length === 0 && (
          <p className="biblio-modal__vacio">
            No hay canciones guardadas. Importa pistas y pulsa "Guardar en biblioteca".
          </p>
        )}

        {!cargando && canciones.length > 0 && (
          <ul className="biblio-modal__lista">
            {canciones.map((c) => (
              <li key={c.id} className="biblio-modal__fila">
                <div className="biblio-modal__info">
                  <span className="biblio-modal__nombre">{c.nombre}</span>
                  <span className="biblio-modal__meta">
                    {c.bpm} BPM · {formatDuracion(c.duracionSeg)} ·{' '}
                    {c.bloques.length} bloque{c.bloques.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="biblio-modal__acciones">
                  <button
                    onClick={() => onCargar(c)}
                    disabled={ocupado}
                    className="biblio-modal__btn biblio-modal__btn--cargar"
                  >
                    Cargar
                  </button>
                  <button
                    onClick={() => {
                      onEliminar(c.id);
                      setCanciones((prev) => prev.filter((x) => x.id !== c.id));
                    }}
                    disabled={ocupado}
                    className="biblio-modal__btn biblio-modal__btn--eliminar"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
