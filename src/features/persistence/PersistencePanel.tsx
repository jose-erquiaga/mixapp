/**
 * Barra de proyecto: guardar/cargar en IndexedDB, exportar WAV y guardar en
 * la biblioteca local persistente. Presentacional.
 */

import './PersistencePanel.css';

export interface PersistencePanelProps {
  ocupado: boolean;
  estado: string | null;
  hayGuardado: boolean;
  puedeGuardar: boolean;
  puedeExportar: boolean;
  onGuardar: () => void;
  onCargar: () => void;
  onExportar: () => void;
  bibliotecaOcupado?: boolean;
  bibliotecaEstado?: string | null;
  puedeGuardarBiblioteca?: boolean;
  onGuardarBiblioteca?: () => void;
  onAbrirBiblioteca?: () => void;
  hayBiblioteca?: boolean;
}

export function PersistencePanel({
  ocupado,
  estado,
  hayGuardado,
  puedeGuardar,
  puedeExportar,
  onGuardar,
  onCargar,
  onExportar,
  bibliotecaOcupado,
  bibliotecaEstado,
  puedeGuardarBiblioteca,
  onGuardarBiblioteca,
  onAbrirBiblioteca,
  hayBiblioteca,
}: PersistencePanelProps) {
  const todoOcupado = ocupado || !!bibliotecaOcupado;
  return (
    <div className="proyecto-barra">
      <div className="proyecto-barra__acciones">
        <button onClick={onGuardar} disabled={todoOcupado || !puedeGuardar}>
          💾 Guardar
        </button>
        <button onClick={onCargar} disabled={todoOcupado || !hayGuardado}>
          📂 Cargar
        </button>
        <button
          className="proyecto-barra__exportar"
          onClick={onExportar}
          disabled={todoOcupado || !puedeExportar}
        >
          ⬇ Exportar WAV
        </button>
        {onGuardarBiblioteca && (
          <button onClick={onGuardarBiblioteca} disabled={todoOcupado || !puedeGuardarBiblioteca}>
            📚 Guardar en biblioteca
          </button>
        )}
        {onAbrirBiblioteca && (
          <button onClick={onAbrirBiblioteca} disabled={todoOcupado || !hayBiblioteca}>
            📖 Biblioteca
          </button>
        )}
      </div>
      {(estado || bibliotecaEstado) && (
        <span className="proyecto-barra__estado">{bibliotecaEstado || estado}</span>
      )}
    </div>
  );
}
