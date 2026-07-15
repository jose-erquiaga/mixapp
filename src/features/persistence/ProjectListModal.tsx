import { type ProjectSnapshot } from './projectStore';
import './ProjectListModal.css';

interface Props {
  abierto: boolean;
  proyectos: ProjectSnapshot[];
  ocupado: boolean;
  onSeleccionar: (id: string) => void;
  onEliminar: (id: string) => void;
  onCerrar: () => void;
}

function formatFecha(ts: number): string {
  return new Date(ts).toLocaleString('es', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProjectListModal({
  abierto,
  proyectos,
  ocupado,
  onSeleccionar,
  onEliminar,
  onCerrar,
}: Props) {
  if (!abierto) return null;

  return (
    <div className="plm-overlay">
      <div className="plm-panel">
        <div className="plm-cabecera">
          <h2 className="plm-titulo">Sesiones guardadas</h2>
          <button className="plm-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {proyectos.length === 0 ? (
          <p className="plm-vacio">No hay sesiones guardadas.</p>
        ) : (
          <ul className="plm-lista">
            {proyectos.map((p) => (
              <li key={p.id} className="plm-fila">
                <div className="plm-info">
                  <span className="plm-nombre">{p.nombre}</span>
                  <span className="plm-meta">
                    {formatFecha(p.guardadoEn)} · {p.tracks.length} pista
                    {p.tracks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="plm-acciones">
                  <button
                    className="plm-btn plm-btn--cargar"
                    disabled={ocupado}
                    onClick={() => onSeleccionar(p.id)}
                  >
                    Cargar
                  </button>
                  <button
                    className="plm-btn plm-btn--eliminar"
                    disabled={ocupado}
                    onClick={() => onEliminar(p.id)}
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
