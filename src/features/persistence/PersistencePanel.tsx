/**
 * Barra de proyecto: guardar/cargar en IndexedDB y exportar la mezcla a WAV.
 * Presentacional; la lógica vive en `usePersistence`.
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
}: PersistencePanelProps) {
  return (
    <div className="proyecto-barra">
      <div className="proyecto-barra__acciones">
        <button onClick={onGuardar} disabled={ocupado || !puedeGuardar}>
          💾 Guardar
        </button>
        <button onClick={onCargar} disabled={ocupado || !hayGuardado}>
          📂 Cargar
        </button>
        <button
          className="proyecto-barra__exportar"
          onClick={onExportar}
          disabled={ocupado || !puedeExportar}
        >
          ⬇ Exportar WAV
        </button>
      </div>
      {estado && <span className="proyecto-barra__estado">{estado}</span>}
    </div>
  );
}
